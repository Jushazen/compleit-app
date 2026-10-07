package com.compleitapp

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers [ExactAlarmModule] as a legacy (non-Turbo) native module; the New
 * Architecture interop layer exposes it to JS as NativeModules.ExactAlarm.
 */
class ExactAlarmPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == ExactAlarmModule.NAME) ExactAlarmModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      ExactAlarmModule.NAME to
        ReactModuleInfo(
          name = ExactAlarmModule.NAME,
          className = ExactAlarmModule::class.java.name,
          canOverrideExistingModule = false,
          needsEagerInit = false,
          isCxxModule = false,
          isTurboModule = false,
        )
    )
  }
}
