Using Sentry with Ionic
-----------------------

To use Sentry with `Ionic <https://ionicframework.com/>`_ you have to add
`@sentry/cordova` as a depenendcy to you package.json.  Also you need to add it as a
cordova plugin with ``ionic cordova plugin add @sentry/cordova``.

    $ npm i @sentry/cordova --save

Upon adding it Sentry Wizard will configure the project for you.
Additionaly you have to add the following to your ``app.module.ts``::

.. sourcecode:: javascript

    import * as Sentry from '@sentry/core';
    import { SentryBrowser } from '@sentry/browser';
    import { SentryCordova } from '@sentry/cordova';

    Sentry.create('___DSN___')
        .use(SentryCordova, {sentryBrowser: SentryBrowser})
        .install();

Note that we try to set the release dynamically in the ``index.html``
but if it fails you should call ``setRelease``.

.. sourcecode:: javascript

    Sentry.create('___DSN___')
        .use(SentryCordova, {sentryBrowser: SentryBrowser})
        .install().then(client => {
            client.setRelease('your-release');
        });

In order to also use the Ionic provided ``IonicErrorHandler`` we need to add the following
to ``app.module.ts``::

Add this to ``app.module.ts``::

.. sourcecode:: javascript
    class SentryIonicErrorHandler extends IonicErrorHandler {
      public handleError(error) {
        super.handleError(error);
        try {
          Sentry.getSharedClient().captureException(error.originalError || error);
        } catch (e) {
          console.error(e);
        }
      }
    }

Then change the ``@NgModule{providers:[]}`` to following:

.. sourcecode:: javascript
    @NgModule({
      ...
      providers: [
        StatusBar,
        SplashScreen,
        // {provide: ErrorHandler, useClass: IonicErrorHandler} remove this, add next line
        {provide: ErrorHandler, useClass: SentryIonicErrorHandler}
      ]
    })
