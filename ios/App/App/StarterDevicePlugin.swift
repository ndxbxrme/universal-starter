import Foundation
import Capacitor
import UIKit
import CoreMotion
import AVFoundation

@objc(StarterDevicePlugin)
public class StarterDevicePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StarterDevicePlugin"
    public let jsName = "StarterDevice"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPreferences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPreferences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPreferences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sampleMotion", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelRecording", returnType: CAPPluginReturnPromise)
    ]
    private let motion = CMMotionManager()
    private var motionCall: CAPPluginCall?
    private var motionTimeout: DispatchWorkItem?
    private var recorder: AVAudioRecorder?
    private var recordingURL: URL?
    private var started: Date?
    private var recordingGeneration = 0

    public override func load() {
        UserDefaults.standard.register(defaults: ["highAccuracy": true, "distanceUnit": "km"])
        NotificationCenter.default.addObserver(self, selector: #selector(inactive), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }
    @objc func getPreferences(_ call: CAPPluginCall) {
        call.resolve(["highAccuracy": UserDefaults.standard.bool(forKey: "highAccuracy"), "distanceUnit": UserDefaults.standard.string(forKey: "distanceUnit") == "mi" ? "mi" : "km"])
    }
    @objc func setPreferences(_ call: CAPPluginCall) {
        guard let high = call.getBool("highAccuracy"), let unit = call.getString("distanceUnit"), ["mi", "km"].contains(unit) else { call.reject("Invalid preferences", "FAILED"); return }
        UserDefaults.standard.set(high, forKey: "highAccuracy")
        UserDefaults.standard.set(unit, forKey: "distanceUnit")
        call.resolve()
    }
    @objc func openPreferences(_ call: CAPPluginCall) { openAppSettings(call) }
    @objc func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else { call.reject("Settings unavailable", "UNSUPPORTED"); return }
            UIApplication.shared.open(url, options: [:]) { success in
                if success { call.resolve() } else { call.reject("Settings unavailable", "UNSUPPORTED") }
            }
        }
    }
    @objc func sampleMotion(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.motionCall == nil else { call.reject("A sample is already pending", "FAILED"); return }
            guard self.motion.isAccelerometerAvailable else { call.reject("Accelerometer unavailable", "UNSUPPORTED"); return }
            self.motionCall = call
            self.motion.accelerometerUpdateInterval = 0.1
            let timeout = DispatchWorkItem { [weak self] in self?.finishMotion(error: "No motion sample arrived") }
            self.motionTimeout = timeout
            DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: timeout)
            self.motion.startAccelerometerUpdates(to: .main) { [weak self] data, error in
                guard let self = self else { return }
                if error != nil { self.finishMotion(error: "Motion access failed"); return }
                if let a = data?.acceleration {
                    let pending = self.motionCall
                    self.clearMotion()
                    pending?.resolve(["accelerationIncludingGravity": ["x": a.x * 9.80665, "y": a.y * 9.80665, "z": a.z * 9.80665], "units": "m/s²"])
                }
            }
        }
    }
    private func clearMotion() { motion.stopAccelerometerUpdates(); motionTimeout?.cancel(); motionTimeout = nil; motionCall = nil }
    private func finishMotion(error: String) { let call = motionCall; clearMotion(); call?.reject(error, "UNSUPPORTED") }

    @objc func startRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.recorder == nil else { call.reject("Recording already running", "FAILED"); return }
            self.recordingGeneration += 1
            let generation = self.recordingGeneration
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                DispatchQueue.main.async {
                    guard generation == self.recordingGeneration else { call.reject("Recording cancelled", "CANCELLED"); return }
                    guard granted else { call.reject("Microphone permission denied", "PERMISSION_DENIED"); return }
                    self.beginRecording(call)
                }
            }
        }
    }
    private func beginRecording(_ call: CAPPluginCall) {
        guard UIApplication.shared.applicationState != .background else { call.reject("App inactive", "CANCELLED"); return }
        discard()
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try session.setActive(true)
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("audio-note-\(UUID().uuidString).m4a")
            recordingURL = url
            recorder = try AVAudioRecorder(url: url, settings: [AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 1, AVEncoderBitRateKey: 96000])
            guard recorder?.record(forDuration: 61) == true else { throw NSError(domain: "StarterAudio", code: 1) }
            started = Date()
            call.resolve()
        } catch { discard(); call.reject("Microphone recording could not start", "FAILED") }
    }
    @objc func stopRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let recorder = self.recorder, let url = self.recordingURL else { call.reject("No recording is active", "FAILED"); return }
            recorder.stop(); self.recorder = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            do {
                let info = try url.resourceValues(forKeys: [.fileSizeKey])
                let bytes = info.fileSize ?? 0
                guard bytes > 0 else { throw NSError(domain: "StarterAudio", code: 2) }
                call.resolve(["path": url.absoluteString, "bytes": bytes, "durationMs": Int(Date().timeIntervalSince(self.started ?? Date()) * 1000)])
            } catch { self.discard(); call.reject("No usable audio captured", "FAILED") }
        }
    }
    @objc func cancelRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.recordingGeneration += 1; self.discard(); call.resolve() }
    }
    private func discard() {
        recorder?.stop(); recorder = nil
        if let url = recordingURL { try? FileManager.default.removeItem(at: url) }
        recordingURL = nil; started = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
    @objc private func inactive() { if recorder != nil { recordingGeneration += 1; discard() }; finishMotion(error: "App inactive") }
    deinit { NotificationCenter.default.removeObserver(self); motion.stopAccelerometerUpdates(); recorder?.stop(); if let url = recordingURL { try? FileManager.default.removeItem(at: url) } }
}

class StarterViewController: CAPBridgeViewController {
    override func capacitorDidLoad() { bridge?.registerPluginInstance(StarterDevicePlugin()) }
}
