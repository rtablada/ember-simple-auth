var testController;
var TestController = Ember.Controller.extend(Ember.SimpleAuth.LoginControllerMixin, {
  actions: {
    loginSucceeded: function() {
      this.invokedLoginSucceeded = true;
    },
    loginFailed: function(xhr, status, error) {
      this.invokedLoginFailed   = true;
      this.loginFailedArguments = [xhr, status, error];
    }
  }
});

var ajaxMock;
var AjaxMock = Ember.Object.extend({
  ajaxCapture: function(url, options) {
    this.requestUrl     = url;
    this.requestOptions = options;
    return {
      then: function(success, fail) {
        success({ session: { authToken: 'authToken' } });
        fail('xhr', 'status', 'error');
      }
    };
  }
});

module('Ember.SimpleAuth.LoginControllerMixin', {
  originalAjax: Ember.$.ajax,
  setup: function() {
    testController                      = TestController.create();
    ajaxMock                            = AjaxMock.create();
    Ember.SimpleAuth.serverSessionRoute = '/token/route';
    Ember.$.ajax                        = Ember.$.proxy(ajaxMock.ajaxCapture, ajaxMock);
    testController.set('session', Ember.SimpleAuth.Session.create());
    testController.setProperties({ identification: 'identification', password: 'password' });
  },
  teardown: function() {
    Ember.$.ajax = this.originalAjax;
  }
});

test('sends a POST request to the session route on login', function() {
  testController.send('login');

  equal(ajaxMock.requestUrl, '/token/route', 'Ember.SimpleAuth.LoginControllerMixin sends a request to the serverSessionRoute on login.');
  equal(ajaxMock.requestOptions.type, 'POST', 'Ember.SimpleAuth.LoginControllerMixin sends a POST request on login.');
  equal(ajaxMock.requestOptions.data, 'grant_type=password&username=identification&password=password', 'Ember.SimpleAuth.LoginControllerMixin sends a request with the correct data on login.');
  equal(ajaxMock.requestOptions.contentType, 'application/x-www-form-urlencoded', 'Ember.SimpleAuth.LoginControllerMixin sends a request with the content type "application/json" on login.');
});

test('does not send a request on login when identification or password are empty', function() {
  testController.setProperties({ identification: '', password: 'password' });
  testController.send('login');

  equal(ajaxMock.requestUrl, undefined, 'Ember.SimpleAuth.LoginControllerMixin does not send a request on login when identification is empty.');

  testController.setProperties({ identification: 'identification', password: '' });
  testController.send('login');

  equal(ajaxMock.requestUrl, undefined, 'Ember.SimpleAuth.LoginControllerMixin does not send a request on login when password is empty.');

  testController.setProperties({ identification: '', password: '' });
  testController.send('login');

  equal(ajaxMock.requestUrl, undefined, 'Ember.SimpleAuth.LoginControllerMixin does not send a request on login when identification and password are empty.');
});

test('updates the current session with the server response on login', function() {
  testController.send('login');

  equal(testController.session.get('authToken'), 'authToken', 'Ember.SimpleAuth.LoginControllerMixin updates the current session with the server response on login.');
});

test('invokes the login succeeded action when login is successful', function() {
  testController.send('login');

  ok(testController.invokedLoginSucceeded, 'Ember.SimpleAuth.LoginControllerMixin invokes the loginSucceeded action when login is successful.');
});

test('invokes the login failed action with the callback arguments', function() {
  testController.send('login');

  ok(testController.invokedLoginFailed, 'Ember.SimpleAuth.LoginControllerMixin invokes the loginFailed action when the request fails.');
  deepEqual(testController.loginFailedArguments, ['xhr', 'status', 'error'], 'Ember.SimpleAuth.LoginControllerMixin invokes the loginFailed action with the callback arguments when the request fails.');
});
