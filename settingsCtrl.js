'use strict';
// 'app' is the module defined in scripts/app.js
app.controller('settingsCtrl', ['$scope', 'settingsFactory', '_', '$uibModal',
	'toaster', '$q', '$filter', '$localpopup', '$timeout', '$rootScope', 'settingsAdminFactory', '$window', '$state',
	function ($scope, settingsFactory, _, $uibModal, toaster, $q, $filter, $localpopup,
		$timeout, $rootScope, settingsAdminFactory, $window, $state) {
		$scope.settingsOptions = {};
		$scope.listGrouped = {};
		$scope.providerList = [];
		$scope.actualdata = {};
		$scope.autoSuggestOptions = [];
		$scope.enteredvalue;
		$scope.loading = false;

		$scope.getProviders = function () {
			settingsAdminFactory.getList().then(function (response) {
				$scope.salesAdminProvidersList = response;
			}, function (error) {
				$scope.salesAdminProvidersList = [];
				console.log(error);
			})
		}

		$scope.init = function () {
			settingsFactory.getDataByProvider().then(function (result) {
				settingsFactory.get().then(function (sGrid) {
					$scope.settingsOptions = sGrid;
					//popoverdata for regions
					$scope.settingsOptions.data = _.forEach($scope.settingsOptions.data, function (data) {
						if (!_.isEmpty(data.Regions.option)) {
							var indexes = data.Regions.option.split(',');
							var regionsArray = [];
							_.forEach(indexes, function (i) {

								_.forEach($scope.regionOptions.list, function (o) {
									if (i == o.value) {
										regionsArray.push({ 'value': o.displayName });
									}
								})
								regionsArray = _.sortBy(regionsArray, ['value']);
								data.Regions.regionNames = _.join(_.map(regionsArray, "value"), ", ");
							})
						}
					})
					rebuildAutoSuggestOptions($scope.settingsOptions.data);
					$scope.settingsOptions.onActionClick = function (key, row, $event) {
						if (key === "update") {
							$scope.edit(row.Id.value, row);
						}
						if (key === "delete") {
							$scope.delete(row.Id.value, row);
						}
					};
					$scope.actualdata = angular.copy($scope.settingsOptions);
				}, function (reason) { })
			}, function (reason) {
			})

			var promises = [];
			$scope.Settings = [];

			promises.push(settingsFactory.getRegions());
			promises.push(settingsFactory.getRetailers());
			promises.push(settingsFactory.getCurrency());
			promises.push(settingsFactory.getRoles());
			promises.push(settingsFactory.getProviders());
			promises.push(settingsFactory.getModuleProvider());
			promises.push(settingsFactory.getDateRange());
			promises.push(settingsFactory.getRights());

			$q.all(promises).then(function (responses) {
				$scope.loading = false;
				$scope.Settings = responses;
				$scope.regionOptions = angular.copy(responses[0]);
				$scope.retailerOptions = angular.copy(responses[1]);
				$scope.roleOptions = angular.copy(responses[3]);
				$scope.providerOptions = angular.copy(responses[4]);
				$scope.moduleOptions = angular.copy(responses[5]);

				$scope.moduleOptions.list = [
					{ "value": 1, "displayName": "Marketing" },
					{ "value": 2, "displayName": "My Library" },
					{ "value": 3, "displayName": "Updates" }
				];

				if ($rootScope.check('Exec') || $rootScope.check('Support')) {
					$scope.providerOptions.class = "btn-md col-180p form-control";
					$scope.regionOptions.class = "btn-md col-180p";
					$scope.retailerOptions.class = "btn-md col-180p";
					$scope.roleOptions.class = "btn-md col-180p";
					$scope.moduleOptions.class = "btn-md col-180p";
				} else if ($rootScope.check('Admin')) {
					$scope.regionOptions.class = "btn-md col-225p";
					$scope.retailerOptions.class = "btn-md col-225p";
					$scope.roleOptions.class = "btn-md col-225p";
					$scope.moduleOptions.class = "btn-md col-225p";
				}

				$scope.regionOptions.truncateLength = 16;

				$scope.totalRegions = _.size($scope.regionOptions.list)
				$scope.providerOptions.list.unshift({ Text: "All", value: null })

				$scope.providerOptions.filterChange = function () {

					$scope.filterAll();
				}
				$scope.regionOptions.filterChange = function () {
					$scope.filterAll();
				}
				$scope.retailerOptions.filterChange = function () {
					$scope.filterAll();
				}
				$scope.roleOptions.filterChange = function () {
					$scope.filterAll();
				}
				$scope.moduleOptions.filterChange = function () {
					$scope.filterAll();
				}

				$scope.regionOptions.selectAll = function () {
					$scope.filterAll();
				}
				$scope.retailerOptions.selectAll = function () {
					$scope.filterAll();
				}
				$scope.roleOptions.selectAll = function () {
					$scope.filterAll();
				}
				$scope.moduleOptions.selectAll = function () {
					$scope.filterAll();
				}
				$scope.loading = true;
			}, function (reason) { })
		};

		$scope.filterAll = function () {
			$timeout(function () {
				if (_.isEmpty($scope.searchKeyword)) {
					$scope.settingsOptions.data = angular.copy($scope.actualdata.data)
				}
				var tempData = angular.copy($scope.settingsOptions.data)

				if (!_.isEmpty($scope.providerOptions.selectedKey) && $scope.providerOptions.selectedKey != 'All'
					&& $scope.providerOptions.selectedKey != 'Select') {
					tempData = _.filter(tempData, function (o) {
						if (o.Provider.value == $scope.providerOptions.selectedKey) { return o; }
					});
				}

				if (($scope.regionOptions.selectedLength > 0) &&
					($scope.regionOptions.selectedLength != $scope.regionOptions.list.length)) {
					var regions = [];
					regions = _.filter($scope.regionOptions.list, function (o) {
						return (o.selected == true)
					})
					if (regions.length > 0) {
						tempData = _.filter(tempData, function (o) {
							var found = false;
							_.forEach(regions, function (obj) {
								if (!_.isNil(o.Regions.option) &&
									_.toUpper(o.Regions.option).indexOf(_.toUpper(obj.value)) !== -1) {
									found = true;
									return;
								}
							})
							return found;
						});
					}
				}


				if (($scope.retailerOptions.selectedLength > 0) &&
					($scope.retailerOptions.selectedLength != $scope.retailerOptions.list.length)) {
					var retailers = [];
					retailers = _.filter($scope.retailerOptions.list, function (o) {
						return (o.selected == true)
					})
					if (retailers.length > 0) {
						tempData = _.filter(tempData, function (o) {
							var found = false;
							_.forEach(retailers, function (obj) {
								if (!_.isNil(o.Retailer.value) &&
									_.toUpper(o.Retailer.value).indexOf(_.toUpper(obj.displayName)) !== -1) {
									found = true;
									return;
								}
							})
							return found;
						});
					}
				}

				if (($scope.moduleOptions.selectedLength > 0) &&
					($scope.moduleOptions.selectedLength != $scope.moduleOptions.list.length)) {
					var modules = [];
					modules = _.filter($scope.moduleOptions.list, function (o) {
						return (o.selected == true)
					})
					if (modules.length > 0) {
						tempData = _.filter(tempData, function (o) {
							var found = false;
							_.forEach(modules, function (obj) {
								if (!_.isNil(o.Modules.value) &&
									_.toUpper(o.Modules.value).indexOf(_.toUpper(obj.displayName)) !== -1) {
									found = true;
									return;
								}
							})
							return found;
						});
					}
				}

				if (($scope.roleOptions.selectedLength > 0) &&
					($scope.roleOptions.selectedLength != $scope.roleOptions.list.length)) {
					var roles = [];
					roles = _.filter($scope.roleOptions.list, function (o) {
						return (o.selected == true)
					})
					if (roles.length > 0) {
						tempData = _.filter(tempData, function (o) {
							var found = false;
							_.forEach(roles, function (obj) {
								if (!_.isNil(o.Roles.value) &&
									_.toUpper(o.Roles.value).indexOf(_.toUpper(obj.displayName)) !== -1) {
									found = true;
									return;
								}
							})
							return found;
						});
					}
				}
				$scope.settingsOptions.data = tempData;
			}, 10)
		}
		$scope.selectedText = function (option) {
			if (option && option.list) {
				if (option.selectedLength != option.list.length) {
					if (!_.isNil(option.selectedLength) && option.selectedLength > 0) {
						return ("(" + option.selectedLength + " of " + option.list.length + ")")
					} else {
						return ""
					}
				} else {
					return ""
				}
			}
		}
		$scope.create = function () {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'views/settings/Instance.html',
				controller: 'InstanceCtrl',
				size: 'lg',
				resolve: {
					recordId: function () {
						return (null);
					},
					Settings: function () {
						return ($scope.Settings)
					},
					salesAdminProvidersList: function () {
						return ($scope.salesAdminProvidersList)
					}
				}
			});
			modalInstance.result.then(function (result) {
				if (result.result == "Create") {
					toaster.pop({
						type: 'info',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Success',
							text: ' has been created!'
						}
					})
					$scope.init();
				} else if (result.result == "duplicate") {
					toaster.pop({
						type: 'error',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Duplicates',
							text: result.message
						}
					})
				} else if (result.result == "domainName") {
					toaster.pop({
						type: 'error',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Domain Name',
							text: "Please enter valid domain name."
						}
					})
				} else {
					toaster.pop({
						type: 'error',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Error',
							text: result.message
						}
					})
				}
			}, function () {

			});
		}

		$scope.delete = function (id, row) {
			$scope.Id = id;
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: "views/delete.html",
				controller: 'deleteCtrl',
				resolve: {
					recordType: function () {
						return ('');
					},
					recordId: function () {
						return ({ domainId: id, });
					},
					recordInfo: function () {
						return ({ displayName: "" });
					}
				}
			});
			modalInstance.result.then(function (result) {
				if (result) {
					if (parseInt($scope.Id) === $rootScope.current.Id) {
						if ($window.localStorage.getItem("current")) {
							$window.localStorage.removeItem("current");
						}
						$rootScope.current = null;
						$state.go("login")
					}

					$scope.settingsOptions.data = _.reject($scope.settingsOptions.data, function (o) {
						return o.Id.value == id;
					})
					$scope.actualdata.data = _.reject($scope.actualdata.data, function (o) {
						return o.Id.value == id;
					})
				}
			}, function () { });
		}

		$scope.edit = function (id, row) {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'views/settings/Instance.html',
				controller: 'InstanceCtrl',
				size: 'lg',
				resolve: {
					recordId: function () {
						return (id);
					},
					Settings: function () {
						return ($scope.Settings)
					},
					salesAdminProvidersList: function () {
						return ($scope.salesAdminProvidersList)
					}
				}
			});
			modalInstance.result.then(function (result) {
				if (result.result == "domainName") {
					toaster.pop({
						type: 'error',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Domain Name',
							text: result.message
						}
					})
				}
				else if (result.result == "duplicate") {
					toaster.pop({
						type: 'error',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Duplicates',
							text: result.message
						}
					})
				} else {
					toaster.pop({
						type: 'info',
						body: 'bind-unsafe-html',
						bodyOutputType: 'directive',
						directiveData: {
							title: 'Success',
							text: ' has been updated!'
						}
					})

					row.Email.value = result.newRow.Email.value
					row.Id.value = result.newRow.Id.value
					row.Modules.value = result.newRow.Modules.value
					row.Name.value = result.newRow.Name.value
					row.Provider.value = result.newRow.Provider.value
					row.Regions.value = result.newRow.Regions.value
					row.Regions.option = result.newRow.Regions.option
					row.Retailer.value = result.newRow.Retailer.value
					row.Roles.value = result.newRow.Roles.value

					row.backGround = { 'background-color': '#DBFAAC' }
					$timeout(function () {
						row.backGround = { 'background-color': 'white' }
					}, 3000);

					_.forEach($scope.actualdata.data, function (o) {
						if (o.Id.value == id) {
							o.Email.value = result.newRow.Email.value;
							o.Modules.value = result.newRow.Modules.value;
							o.Name.value = result.newRow.Name.value;
							o.Provider.value = result.newRow.Provider.value;
							o.Regions.value = result.newRow.Regions.value;
							o.Regions.option = result.newRow.Regions.option;
							o.Retailer.value = result.newRow.Retailer.value;
							o.Roles.value = result.newRow.Roles.value;
						}
					})
				}
			}, function () {

			});

		}
		$scope.sortBy = function (col_field) {
			if (col_field.sortOrder == 'asc') {
				col_field.sortOrder = 'desc';
				if (col_field.key == 'Regions') {
					$scope.settingsOptions.data = _.sortBy($scope.settingsOptions.data, col_field.key + ".value");
				} else {
					$scope.settingsOptions.data = _.sortBy($scope.settingsOptions.data, function (data) {
						return data[col_field.key].value.toLowerCase()
					});
				}
			} else {
				col_field.sortOrder = 'asc';
				if (col_field.key == 'Regions') {
					$scope.settingsOptions.data = _.reverse(_.sortBy($scope.settingsOptions.data, col_field.key + ".value"));
				} else {
					$scope.settingsOptions.data = _.reverse(_.sortBy($scope.settingsOptions.data, function (data) {
						return data[col_field.key].value.toLowerCase()
					}));
				}
			}
		}
		var rebuildAutoSuggestOptions = function (data) {
			$scope.autoSuggestOptions = [{ value: '', isEmail: '' }];
			_.forEach(data, function (value, key) {
				$scope.autoSuggestOptions.push({ 'value': value.Name.value, 'isEmail': false });
				$scope.autoSuggestOptions.push({ 'value': value.Email.value, 'isEmail': true });
			});
		};
		$scope.registered = true;
		$scope.hideClear = true;
		$scope.searchKeyword = "";
		$scope.checkEnter = function (searchstring, event) {
			if (event.keyCode == 13) {
				$scope.registered = true;
				$scope.hideClear = false;
				$scope.finalValueClick(searchstring);
			}
		}
		$scope.clearSearch = function () {
			$scope.searchKeyword = null;
			$scope.hideClear = true;
			$scope.registered = true;
			$scope.finalValueClick(null);
		}
		$scope.searchChange = function (searchstring) {
			searchstring = _.toLower(searchstring);
			$scope.hideClear = true;
			if (!_.isEmpty(searchstring)) {

				$scope.initfilteredData = _.filter($scope.autoSuggestOptions, function (o) {
					var index1 = _.toLower(o.value).indexOf(_.toLower(searchstring));
					if (index1 != -1) {
						return ((o.value));
					} else {
						return (_.startsWith(o.value, searchstring));
					}
				});
				var nameFilteredData = _.filter($scope.initfilteredData, { isEmail: false });
				var emailFilteredData = _.filter($scope.initfilteredData, { isEmail: true });
				$scope.filteredData = _.concat(_.uniqBy(nameFilteredData, 'value'), emailFilteredData);

				$scope.filteredData = _.sortBy($scope.filteredData, function (data) {
					return data.value.toLowerCase()
				});

				$scope.registered = false;
			} else {
				$scope.filteredData = null;
				$scope.registered = true;
				$scope.filterAll($scope.searchKeyword);
			}
		}
		$scope.finalValueClick = function (searchstring) {
			var searchObj = [{ 'value': '', 'isEmail': '' }];
			if (!(_.isEmpty(searchstring)) && (searchstring.indexOf('@') != -1)) {
				searchObj.isEmail = true;
				searchObj.value = searchstring;
			}
			else {
				searchObj.value = searchstring;
				searchObj.isEmail = false;
			}
			$scope.finalValueDropDown(searchObj);
		}
		$scope.finalValueDropDown = function (searchstring) {
			$scope.registered = true;
			if (!_.isEmpty(searchstring.value)) {
				$scope.hideClear = false;
			} else {
				$scope.hideClear = true;
				$scope.settingsOptions = angular.copy($scope.actualdata);
			}
			var searchObj = [{ 'value': '', 'isEmail': '' }];

			searchObj.value = searchstring.value;
			searchObj.isEmail = searchstring.isEmail;

			$scope.settingsOptions.data = $scope.actualdata.data;

			if (!_.isEmpty(searchObj.value)) {
				$scope.searchKeyword = searchObj.value;
				if ((searchObj.isEmail == false)) {
					$scope.settingsOptions.data = _.filter($scope.settingsOptions.data, function (o) {
						var index1 = _.toLower(o.Name.value).indexOf(_.toLower(searchObj.value));
						var index2 = _.toLower(o.Email.value).indexOf(_.toLower(searchObj.value));
						if (index1 != -1) {
							return (o);
						} else if (index2 != -1) {
							return (o);
						}
					});
				}
				else {
					$scope.settingsOptions.data = _.filter($scope.settingsOptions.data, function (o) {
						var index1 = _.toLower(o.Email.value).indexOf(_.toLower(searchObj.value));
						if (index1 != -1) {
							return (o);
						}
					});
				}
			}
			$scope.filterAll($scope.searchKeyword);
		}

		$scope.showPopOver = function (value, size) {
			if (value.length > size - 1) {
				return _.join(_.split(value, ','), ', ');
			} else {
				return null;
			}
		}

		$scope.showText = function (value, size) {
			if (!_.isNil(value) && value.length > size - 1) {
				return value.substring(0, size - 3) + "...";
			} else {
				return value;
			}
		}

		$scope.init();
		$scope.getProviders();
	}]);

