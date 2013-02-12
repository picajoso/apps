
/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC', []).config([
    '$httpProvider', function($httpProvider) {
      $httpProvider.defaults.get['requesttoken'] = oc_requesttoken;
      $httpProvider.defaults.post['requesttoken'] = oc_requesttoken;
      $httpProvider.defaults.post['Content-Type'] = 'application/x-www-form-urlencoded';
      $httpProvider.defaults.get['Content-Type'] = 'application/x-www-form-urlencoded';
      return $httpProvider.defaults.transformRequest = function(data) {
        if (angular.isDefined(data)) {
          return data;
        } else {
          return $.param(data);
        }
      };
    }
  ]);

  angular.module('OC').run([
    '$rootScope', 'Router', function($rootScope, Router) {
      var init;
      init = function() {
        return $rootScope.$broadcast('oCRoutesLoaded');
      };
      return Router.registerLoadedCallback(init);
    }
  ]);

}).call(this);


/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC').factory('Notification', function() {
    return OC.Notification;
  });

}).call(this);


/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC').factory('_Publisher', function() {
    var Publisher;
    Publisher = (function() {

      function Publisher() {
        this.subscriptions = {};
      }

      Publisher.prototype.subscribeModelTo = function(model, name) {
        var _base;
        (_base = this.subscriptions)[name] || (_base[name] = []);
        return this.subscriptions[name].push(model);
      };

      Publisher.prototype.publishDataTo = function(data, name) {
        var subscriber, _i, _len, _ref, _results;
        _ref = this.subscriptions[name] || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          subscriber = _ref[_i];
          _results.push(subscriber.handle(data));
        }
        return _results;
      };

      return Publisher;

    })();
    return Publisher;
  });

}).call(this);


/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC').factory('_Request', function() {
    var Request;
    Request = (function() {

      function Request(_$http, _$rootScope, _publisher, _token, _router) {
        var _this = this;
        this._$http = _$http;
        this._$rootScope = _$rootScope;
        this._publisher = _publisher;
        this._token = _token;
        this._router = _router;
        this._initialized = false;
        this._shelvedRequests = [];
        this._$rootScope.$on('oCRoutesLoaded', function() {
          _this._executeShelvedRequests();
          _this._initialized = true;
          return _this._shelvedRequests = [];
        });
      }

      Request.prototype.request = function(route, routeParams, data, onSuccess, onFailure, config) {
        var defaultConfig, key, url, value,
          _this = this;
        if (routeParams == null) {
          routeParams = {};
        }
        if (data == null) {
          data = {};
        }
        if (onSuccess == null) {
          onSuccess = null;
        }
        if (onFailure == null) {
          onFailure = null;
        }
        if (config == null) {
          config = {};
        }
        if (!this._initialized) {
          this._shelveRequest(route, routeParams, data, method, config);
          return;
        }
        url = this._router.generate(route, routeParams);
        defaultConfig = {
          method: 'GET',
          url: url,
          data: data
        };
        for (key in config) {
          value = config[key];
          defaultConfig[key] = value;
        }
        return this._$http(config).success(function(data, status, headers, config) {
          var name, _ref, _results;
          if (onSuccess) {
            onSuccess(data, status, headers, config);
          }
          _ref = data.data;
          _results = [];
          for (name in _ref) {
            value = _ref[name];
            _results.push(_this.publisher.publishDataTo(name, value));
          }
          return _results;
        }).error(function(data, status, headers, config) {
          if (onFailure) {
            return onFailure(data, status, headers, config);
          }
        });
      };

      Request.prototype._shelveRequest = function(route, routeParams, data, method, config) {
        var request;
        request = {
          route: route,
          routeParams: routeParams,
          data: data,
          config: config,
          method: method
        };
        return this._shelvedRequests.push(request);
      };

      Request.prototype._executeShelvedRequests = function() {
        var req, _i, _len, _ref, _results;
        _ref = this._shelvedRequests;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          req = _ref[_i];
          _results.push(this.post(req.route, req.routeParams, req.data, req.method, req.config));
        }
        return _results;
      };

      return Request;

    })();
    return Request;
  });

}).call(this);


/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC').factory('Router', function() {
    return OC.Router;
  });

}).call(this);


/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC').directive('clickSlideToggle', [
    '$rootScope', function($rootScope) {
      return function(scope, elm, attr) {
        var options, slideArea;
        options = scope.$eval(attr.clickSlideToggle);
        if (angular.isDefined(options.selector)) {
          slideArea = $(options.selector);
        } else {
          slideArea = elm;
        }
        elm.click(function() {
          if (slideArea.is(':visible') && !slideArea.is(':animated')) {
            return slideArea.slideUp();
          } else {
            return slideArea.slideDown();
          }
        });
        if (angular.isDefined(options.hideOnFocusLost) && options.hideOnFocusLost) {
          $(document.body).click(function() {
            return $rootScope.$broadcast('oCLostFocus');
          });
          $rootScope.$on('oCLostFocus', function(scope, params) {
            if (params !== slideArea) {
              if (slideArea.is(':visible') && !slideArea.is(':animated')) {
                return slideArea.slideUp();
              }
            }
          });
          slideArea.click(function(e) {
            $rootScope.$broadcast('oCLostFocus', slideArea);
            return e.stopPropagation();
          });
          return elm.click(function(e) {
            $rootScope.$broadcast('oCLostFocus', slideArea);
            return e.stopPropagation();
          });
        }
      };
    }
  ]);

}).call(this);


/*

ownCloud - App Framework

@author Bernhard Posselt
@copyright 2012 Bernhard Posselt nukeawhale@gmail.com

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
License as published by the Free Software Foundation; either
version 3 of the License, or any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU AFFERO GENERAL PUBLIC LICENSE for more details.

You should have received a copy of the GNU Affero General Public
License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() {

  angular.module('OC').directive('forwardClick', function() {
    return function(scope, elm, attr) {
      var options;
      options = scope.$eval(attr.forwardClick);
      if (angular.isDefined(options.selector)) {
        return elm.click(function() {
          return $(options.selector).trigger('click');
        });
      }
    };
  });

}).call(this);
