/* global describe, it, beforeEach, before, after */
const mockery = require('mockery')
const settings = require('../../js/settings')
const settingsConst = require('../../js/constants/settings')
const {passwordManagers, extensionIds, displayNames} = require('../../js/constants/passwordManagers')
const {bookmarksToolbarMode} = require('../../app/common/constants/settingsEnums')
const appConfig = require('../../js/constants/appConfig')
const Immutable = require('immutable')
const assert = require('assert')

require('./braveUnit')

describe('settings unit test', function () {
  let settingsCollection = null

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
  })

  after(function () {
    mockery.disable()
  })

  beforeEach(function () {
    settingsCollection = {}
  })

  describe('getSetting', function () {
    it('returns value from collection if one is provided', function () {
      settingsCollection['testName'] = 'testValue'
      const response = settings.getSetting('testName', settingsCollection)
      assert.equal(response, 'testValue')
    })

    it('returns value from appConfig if both collection and appStore not found', function () {
      const response = settings.getSetting(settingsConst.TABS_PER_PAGE, settingsCollection)
      assert.equal(response, appConfig.defaultSettings[settingsConst.TABS_PER_PAGE])
    })

    it('returns value from appStore if collection not found', function () {
      const nonDefaultValue = appConfig.defaultSettings[settingsConst.TABS_PER_PAGE] + 10
      let settingsState = {}
      settingsState[settingsConst.TABS_PER_PAGE] = nonDefaultValue
      mockery.registerMock('./stores/appStoreRenderer', {
        get state () {
          return Immutable.fromJS({
            settings: settingsState
          })
        }
      })
      const response = settings.getSetting(settingsConst.TABS_PER_PAGE, settingsCollection)
      assert.equal(response, nonDefaultValue)
    })

    describe('when setting default value for null/empty config entries (based on previous session data)', function () {
      describe('ACTIVE_PASSWORD_MANAGER', function () {
        it('returns `1Password` if ONE_PASSWORD_ENABLED was true', function () {
          settingsCollection[settingsConst.ONE_PASSWORD_ENABLED] = true
          const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.ONE_PASSWORD)
        })

        it('returns `Dashlane` if DASHLANE_ENABLED was true', function () {
          settingsCollection[settingsConst.DASHLANE_ENABLED] = true
          const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.DASHLANE)
        })

        it('returns `LastPass` if LAST_PASS_ENABLED was true', function () {
          settingsCollection[settingsConst.LAST_PASS_ENABLED] = true
          const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.LAST_PASS)
        })

        it('returns `BuiltIn` if PASSWORD_MANAGER_ENABLED was true', function () {
          settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
          const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.BUILT_IN)
        })

        it('returns `1Password`/`Dashlane`/`LastPass`, even if PASSWORD_MANAGER_ENABLED was true', function () {
          // 1Password
          settingsCollection[settingsConst.ONE_PASSWORD_ENABLED] = true
          settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
          let response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.ONE_PASSWORD)
          // Dashlane
          settingsCollection = {}
          settingsCollection[settingsConst.DASHLANE_ENABLED] = true
          settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
          response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.DASHLANE)
          // LastPass
          settingsCollection = {}
          settingsCollection[settingsConst.LAST_PASS_ENABLED] = true
          settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
          response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.LAST_PASS)
        })

        it('returns `Unmanaged` if PASSWORD_MANAGER_ENABLED was false', function () {
          settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = false
          const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.UNMANAGED)
        })

        it('defaults to `BuiltIn` if no other conditions are met', function () {
          const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
          assert.equal(response, passwordManagers.BUILT_IN)
        })
      })

      describe('BOOKMARKS_TOOLBAR_MODE', function () {
        it('returns `FAVICONS_ONLY` if SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON was true', function () {
          settingsCollection[settingsConst.SHOW_BOOKMARKS_TOOLBAR_FAVICON] = true
          settingsCollection[settingsConst.SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON] = true
          const response = settings.getSetting(settingsConst.BOOKMARKS_TOOLBAR_MODE, settingsCollection)
          assert.equal(response, bookmarksToolbarMode.FAVICONS_ONLY)
        })

        it('returns `TEXT_AND_FAVICONS` if SHOW_BOOKMARKS_TOOLBAR_FAVICON was true', function () {
          settingsCollection[settingsConst.SHOW_BOOKMARKS_TOOLBAR_FAVICON] = true
          const response = settings.getSetting(settingsConst.BOOKMARKS_TOOLBAR_MODE, settingsCollection)
          assert.equal(response, bookmarksToolbarMode.TEXT_AND_FAVICONS)
        })

        it('defaults to `TEXT_ONLY` if no other conditions are met', function () {
          const response = settings.getSetting(settingsConst.BOOKMARKS_TOOLBAR_MODE, settingsCollection)
          assert.equal(response, bookmarksToolbarMode.TEXT_ONLY)
        })
      })

      describe('settings.PAYMENTS_CONTRIBUTION_AMOUNT', function () {
        it('defaults to payments.defaultContributionAmount when null', function () {
          settingsCollection[settingsConst.PAYMENTS_CONTRIBUTION_AMOUNT] = null
          const response = settings.getSetting(settingsConst.PAYMENTS_CONTRIBUTION_AMOUNT, settingsCollection)
          assert.equal(response, appConfig.payments.defaultContributionAmount)
        })

        it('does not modify value once set', function () {
          const exampleAmount = 10
          settingsCollection[settingsConst.PAYMENTS_CONTRIBUTION_AMOUNT] = exampleAmount
          const response = settings.getSetting(settingsConst.PAYMENTS_CONTRIBUTION_AMOUNT, settingsCollection)
          assert.equal(response, exampleAmount)
        })
      })
    })

    describe('when not setting default value for null/empty config entries', function () {
      it('returns raw value when `defaultWhenNull` is false', function () {
        settingsCollection[settingsConst.PAYMENTS_CONTRIBUTION_AMOUNT] = null
        const response = settings.getSetting(settingsConst.PAYMENTS_CONTRIBUTION_AMOUNT, settingsCollection, false)
        assert.equal(response, null)
      })
    })
  })

  describe('getActivePasswordManager', function () {
    it('returns the active password manager details', function () {
      settingsCollection[settingsConst.ACTIVE_PASSWORD_MANAGER] = passwordManagers.ONE_PASSWORD

      const expectedResult = Immutable.fromJS({
        name: passwordManagers.ONE_PASSWORD,
        extensionId: extensionIds[passwordManagers.ONE_PASSWORD],
        displayName: displayNames[passwordManagers.ONE_PASSWORD]
      })
      const actualResult = settings.getActivePasswordManager(settingsCollection)
      assert.deepEqual(actualResult, expectedResult)
    })

    it('calls getSetting to get the value (providing a default if none exists)', function () {
      settingsCollection[settingsConst.ONE_PASSWORD_ENABLED] = true
      const expectedResult = Immutable.fromJS({
        name: passwordManagers.ONE_PASSWORD,
        extensionId: extensionIds[passwordManagers.ONE_PASSWORD],
        displayName: displayNames[passwordManagers.ONE_PASSWORD]
      })
      const actualResult = settings.getActivePasswordManager(settingsCollection)
      assert.deepEqual(actualResult, expectedResult)
    })
  })
})
