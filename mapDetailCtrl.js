'use strict';

// 'app' is the module defined in scripts/app.js
app.controller('mapDetailCtrl', ['$scope', '$q', '$state',
  'constant', '$popup', '$sidebarFilter', '$stateParams', '$rootScope',
  '$timeout', 'SettingsMapFactory',
  function ($scope, $q, $state,
    constant, $popup, $sidebarFilter, $stateParams, $rootScope, $timeout, SettingsMapFactory) {
    $scope.mapOptions = {}
    var init = function () {
      $scope.$parent.backButton = true;
      $scope.provider = _.split($state.params.Provider, '-')[1]
      $scope.type = $state.params.Type
      if ($scope.type == "RequiredAttentionCount") {
        $scope.type = "Requires Attention"
      } else {
        $scope.type = "Approved"
      }
      $scope.$parent.headerText = _.split($state.params.Provider, '-')[0] + " (" + $scope.type + ")";
      SettingsMapFactory.getDetailData($state.params.Type, $scope.provider, $state.params.Territory).then(function (response) {
        $scope.mapOptions = response;
        $scope.totalData = angular.copy(response);
        $scope.mapOptions.cellClick = function (row, col, event) {
          if (col != '0') {
            var territoryNames, territoryCodes, firstTerritoryCode;
            var territory = ""
            if (_.split($scope.mapOptions.col_fields[col].key, '-')[1] != 'terr') {
              territory = $scope.mapOptions.col_fields[col].key;
            } else {
              territoryNames = '';
              territoryCodes = '';
              territory = $scope.mapOptions.col_fields[col].key
            }
            var url = $state.href('mapResults', {
              Type: $state.params.Type,
              Territory: $scope.mapOptions.col_fields[col].name + '-' + $scope.mapOptions.col_fields[col].key,
              Provider: $state.params.Provider,
              Retailer: $scope.mapOptions.row_fields[row].name + '-' +
              $scope.mapOptions.row_fields[row].key,
              CurrencyCode: "USD"
            });

            window.open(url, '_blank');
          } else {
            event.preventDefault();
          }
        }
        $scope.mapOptions.totalCellClick = function (col, event) {
        }

        $scope.mapOptions.selectedDrillDown = function (col, subField) {
          $scope.mapOptions.col_fields[col].loading = true;
          SettingsMapFactory.getDrillDownData($scope.mapOptions.actualData,
            $scope.mapOptions.row_fields, $scope.mapOptions.col_fields[col],
            subField, $scope.mapOptions.data, $scope.totalData).then(function (response) {
              $scope.mapOptions.col_fields[col].loading = false;
              $scope.mapOptions.data = angular.copy(response.data);
              $scope.mapOptions.col_fields[col].name = response.col_field.name;
              $scope.mapOptions.col_fields[col].key = response.col_field.key;
            }, function (error) { });
        }
      }, function (error) { });
    }
    $scope.$parent.back = function () {
      $scope.$parent.backButton = false;
      $scope.$parent.headerText = "All Maps"
      $state.go('root.settings.map')
    }
    $scope.$on('mapRefreshDashboard', function (event, args) {
      init();
    })
    init();

  }]);
