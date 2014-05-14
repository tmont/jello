var routes = require('../../routes'),
	lifetime = require('sahara').lifetime,
	url = require('url');

module.exports = function(container, libs, next) {
	var app = container.resolveSync('App');
	var config = container.resolveSync('Config');

	function routeGet(route, data) {
		function setRoute(req, res, next) {
			req.container.registerInstance(route, 'CurrentRoute', lifetime.memory());
			next();
		}

		//provide a way for the controller to discover that
		//this is a request for just the content of the page
		function thisIsContent(req, res, next) {
			req.container.resolveSync('ControllerContext').isContentRequest = true;
			res.set('Content-Type', 'application/json');
			next();
		}

		var url = route.url || '*';
		app.get(url + '.content', setRoute, thisIsContent, route.middleware(app), data);
		app.get(url, setRoute, route.middleware(app), data);
	}

	/**
	 *
	 * LEGACY ROUTES
	 */
	app.get(/\/game.aspx/i, { controller: 'game', action: 'legacy' });
	app.get(/\/team.aspx/i, { controller: 'team', action: 'legacy' });

	app.get('/version', function(req, res) {
		res.send(config.version);
	});

	routeGet(routes.home, { controller: 'home' });
	app.get(routes.autocompleteUserJson.url, { controller: 'autocomplete', action: 'users' });
	app.get('/favicon.ico', { controller: 'home', action: 'favicon' });
	app.get('/robots.txt', { controller: 'home', action: 'robots' });

	routeGet(routes.manageContent, { controller: 'adminContent', action: 'dashboard' });
	routeGet(routes.contentPreview, { controller: 'adminContent', action: 'preview' });
	routeGet(routes.newContent, { controller: 'adminContent', action: 'newContent' });
	app.post(routes.newContent.url, { controller: 'adminContent', action: 'saveContent' });
	routeGet(routes.editContent, { controller: 'adminContent', action: 'editContent' });
	app.post(routes.editContent.url, { controller: 'adminContent', action: 'saveContent' });
	routeGet(routes.blogPermalink, { controller: 'blog', action: 'permalink', discriminator: 'blog_post' });
	routeGet(routes.contentPermalink, { controller: 'blog', action: 'permalink', discriminator: 'article' });

	routeGet(routes.registration, { controller: 'registration', action: 'viewRegistration' });
	routeGet(routes.unsubscribe, { controller: 'account', action: 'unsubscribe' });
	routeGet(routes.activateAccount, { controller: 'account', action: 'resetPasswordReturn', discriminator: 'activate' });
	app.post(routes.activateAccount.url, { controller: 'account', action: 'resetPasswordTo', discriminator: 'activate' });
	app.post('/account/process-bounce', { controller: 'account', action: 'bounce' });
	routeGet(routes.adminAffiliate, { controller: 'admin', action: 'editAffiliate' });
	app.post(routes.adminAffiliate.url, { controller: 'admin', action: 'saveAffiliate' });
	routeGet(routes.affiliateSettings, { controller: 'affiliateAdmin', action: 'manage' });
	app.post(routes.affiliateSettings.url, { controller: 'affiliateAdmin', action: 'save' });
	routeGet(routes.manageCompetitions, { controller: 'adminCompetition'});
	app.post(routes.manageCompetitions.url, { controller: 'adminCompetition', action: 'saveCompetitionDefinition' });
	app.post(routes.manageCompetitions.url + '/competition', { controller: 'adminCompetition', action: 'saveCompetition' });
	routeGet(routes.manageCompetitionLevels, { controller: 'competitionLevelAdmin', action: 'manage' });
	app.post(routes.createCompetitionLevel.url, { controller: 'competitionLevelAdmin', action: 'create' });
	routeGet(routes.adminDashboard, { controller: 'admin' });
	app.post(routes.deleteDivision.url, { controller: 'adminDivision', action: 'deleteDivision' });
	app.post(routes.deleteCompetition.url, { controller: 'adminCompetition', action: 'deleteCompetition' });
	app.post(routes.draftPlayerToTeam.url, { controller: 'adminCompetition', action: 'draftPlayerToTeam' });
	app.post(routes.deleteTeam.url, { controller: 'adminTeam', action: 'deleteTeam' });

	routeGet(routes.manageFields, { controller: 'adminField', action: 'manageFields' });
	routeGet(routes.createField, { controller: 'adminField', action: 'createField'});
	routeGet(routes.editField, { controller: 'adminField', action: 'editField'});
	app.post(routes.createField.url, { controller: 'adminField', action: 'saveField' });
	app.post(routes.editField.url, { controller: 'adminField', action: 'saveField' });

	routeGet(routes.adminViewRegistration, { controller: 'adminRegistration' });
	routeGet(routes.adminFindRegByUserAndComp, { controller: 'adminRegistration', action: 'findRegistrationByUserAndComp' });
	routeGet(routes.adminRegisterAddToTeam, { controller: 'adminRegistration', action: 'addToTeam' });
	app.post(routes.adminRegisterAddToTeam.url, { controller: 'adminRegistration', action: 'processTeamAdd' });
	routeGet(routes.adminRegisterAddToDraft, { controller: 'adminRegistration', action: 'addToDraft' });
	app.post(routes.adminRegisterAddToDraft.url, { controller: 'adminRegistration', action: 'processDraftAdd' });

	routeGet(routes.manageAffiliateUsers, { controller: 'adminRole', action: 'manageUsers', discriminator: 'affiliate' });
	routeGet(routes.emailAffiliateUsers, { controller: 'adminRole', action: 'emailUsers', discriminator: 'affiliate' });
	app.post(routes.emailAffiliateUsers.url, { controller: 'adminRole', action: 'emailUsers', discriminator: 'affiliate' });

	routeGet(routes.manageCompetition, { controller: 'adminCompetition', action: 'manageCompetition'  });
	routeGet(routes.createDivision, { controller: 'adminCompetition', action: 'createDivision' });

	app.post(routes.createDivision.url, { controller: 'adminDivision', action: 'saveDivision' });

	routeGet(routes.manageCompRegistrations, { controller: 'adminCompetition', action: 'manageCompetitionRegistrations' });
	routeGet(routes.manageCompRegSearch, { controller: 'adminCompetition', action: 'manageCompetitionRegistrations' });

	routeGet(routes.competitionBilling, { controller: 'adminBilling' });

	routeGet(routes.manualPayment, { controller: 'adminBilling', action: 'payment', discriminator: 'manual' });
	routeGet(routes.manualPaymentSearch, { controller: 'adminBilling', action: 'payment', discriminator: 'manual' });
	routeGet(routes.processManualPaymentUser, { controller: 'adminBilling', action: 'paymentForUser', discriminator: 'manual' });
	app.post(routes.processManualPaymentUser.url, { controller: 'adminBilling', action: 'processPayment', discriminator: 'manual' });

	routeGet(routes.creditCardPayment, { controller: 'adminBilling', action: 'payment', discriminator: 'credit' });
	routeGet(routes.creditCardPaymentSearch, { controller: 'adminBilling', action: 'payment', discriminator: 'credit' });
	routeGet(routes.processCreditPaymentUser, { controller: 'adminBilling', action: 'paymentForUser', discriminator: 'credit' });
	app.post(routes.processCreditPaymentUser.url, { controller: 'adminBilling', action: 'processPayment', discriminator: 'credit' });

	routeGet(routes.billingFee, { controller: 'adminBilling', action: 'billingEvent', discriminator: 'fee' });
	routeGet(routes.billingFeeSearch, { controller: 'adminBilling', action: 'billingEvent', discriminator: 'fee' });
	routeGet(routes.addBillingFeeToUser, { controller: 'adminBilling', action: 'billingEventForUser', discriminator: 'fee' });
	app.post(routes.addBillingFeeToUser.url, { controller: 'adminBilling', action: 'addBillingEventToUser', discriminator: 'fee' });

	routeGet(routes.billingDeduction, { controller: 'adminBilling', action: 'billingEvent', discriminator: 'deduction' });
	routeGet(routes.billingDeductionSearch, { controller: 'adminBilling', action: 'billingEvent', discriminator: 'deduction' });
	routeGet(routes.addBillingDeductionToUser, { controller: 'adminBilling', action: 'billingEventForUser', discriminator: 'deduction' });
	app.post(routes.addBillingDeductionToUser.url, { controller: 'adminBilling', action: 'addBillingEventToUser', discriminator: 'deduction' });

	routeGet(routes.moveTeam, { controller: 'adminCompetition', action: 'moveTeam' });
	app.post(routes.moveTeam.url, { controller: 'adminCompetition', action: 'moveTeamToNewDivision' });
	routeGet(routes.competitionSettings, { controller: 'adminCompetition', action: 'competitionSettings' });
	app.post(routes.competitionSettings.url, { controller: 'adminCompetition', action: 'saveCompetition' });

	routeGet(routes.manageCompSchedule, { controller: 'adminSchedule', action: 'manageCompetitionSchedule' });
	routeGet(routes.generateSchedule, { controller: 'adminSchedule', action: 'generateSchedule' });
	app.post(routes.generateSchedule.url, { controller: 'adminSchedule', action: 'createSchedule' });
	app.post(routes.swapFields.url, { controller: 'adminSchedule', action: 'swapFields', discriminator: 'default' });
	app.post(routes.swapGeneratedFields.url, { controller: 'adminSchedule', action: 'swapFields', discriminator: 'generated' });
	routeGet(routes.viewGeneratedSchedule, { controller: 'adminSchedule', action: 'viewGeneratedSchedule' });
	routeGet(routes.viewGeneratedSchedForField, { controller: 'adminSchedule', action: 'viewGeneratedScheduleForField' });
	routeGet(routes.viewGenSchedUnusedFields, { controller: 'adminSchedule', action: 'viewUnusedFieldAvailabilitiesForGeneratedSchedule' });
	routeGet(routes.viewFullGeneratedSchedule, { controller: 'adminSchedule', action: 'viewFullGeneratedSchedule' });
	app.post(routes.deleteGeneratedSchedule.url, { controller: 'adminSchedule', action: 'deleteGeneratedSchedule' });
	app.post(routes.publishGeneratedSchedule.url, { controller: 'adminSchedule', action: 'publishGeneratedSchedule' });
	routeGet(routes.addGameToCompetition, { controller: 'adminSchedule', action: 'addGameToCompetition' });
	app.post(routes.addGameToCompetition.url, { controller: 'adminSchedule', action: 'saveGame' });
	routeGet(routes.editGame, { controller: 'adminSchedule', action: 'addGameToCompetition' });
	app.post(routes.editGame.url, { controller: 'adminSchedule', action: 'saveGame' });
	routeGet(routes.manageFieldAvailability, { controller: 'adminSchedule', action: 'manageFieldAvailability' });
	routeGet(routes.createFieldAvailability, { controller: 'adminSchedule', action: 'createFieldAvailability'});
	routeGet(routes.editFieldAvailability, { controller: 'adminSchedule', action: 'editFieldAvailability'});
	app.post(routes.createFieldAvailability.url, { controller: 'adminSchedule', action: 'saveFieldAvailability' });
	app.post(routes.createBulkFieldAvailability.url, { controller: 'adminSchedule', action: 'bulkImportFieldAvailability' });
	routeGet(routes.manageBlackoutDates, { controller: 'adminSchedule', action: 'manageBlackoutDates'});
	app.post(routes.manageBlackoutDates.url, { controller: 'adminSchedule', action: 'deleteBlackoutDate' });
	routeGet(routes.createBlackoutDate, { controller: 'adminSchedule', action: 'createBlackoutDate'});
	app.post(routes.createBlackoutDate.url, { controller: 'adminSchedule', action: 'saveBlackoutDate' });
	routeGet(routes.editBlackoutDate, { controller: 'adminSchedule', action: 'createBlackoutDate'});
	app.post(routes.editBlackoutDate.url, { controller: 'adminSchedule', action: 'saveBlackoutDate' });
	app.post(routes.updateGeneratedGame.url, { controller: 'adminSchedule', action: 'updateGeneratedGame' });

	routeGet(routes.manageDivision, { controller: 'adminDivision' });
	routeGet(routes.divisionSettings, { controller: 'adminDivision', action: 'divisionSettings' });
	app.post(routes.divisionSettings.url, { controller: 'adminDivision', action: 'saveDivision' });
	routeGet(routes.createTeam, { controller: 'adminDivision', action: 'createTeam' });

	app.post(routes.createTeam.url, { controller: 'adminTeam', action: 'saveTeam' });
	routeGet(routes.manageTeam, { controller: 'adminTeam' });
	routeGet(routes.manageTeamRoster, { controller: 'adminTeam', action: 'roster' });
	app.post(routes.invitePlayers.url, { controller: 'adminTeam', action: 'invitePlayers' });
	routeGet(routes.teamSettings, { controller: 'adminTeam', action: 'teamSettings' });
	app.post(routes.teamSettings.url, { controller: 'adminTeam', action: 'saveTeam' });

	routeGet(routes.sendActivateAccount, { controller: 'adminUser', action: 'sendActivationEmail' });
	routeGet(routes.editAffiliateRoles, { controller: 'adminRole', action: 'editRoles', discriminator: 'affiliate' });
	app.post(routes.editAffiliateRoles.url, { controller: 'adminRole', action: 'saveRoles', discriminator: 'affiliate' });
	routeGet(routes.editAffiliateUser, { controller: 'adminRole', action: 'editUser', discriminator: 'affiliate' });
	app.post(routes.editAffiliateUser.url, { controller: 'adminRole', action: 'saveUser', discriminator: 'affiliate' });
	routeGet(routes.viewAffiliateUser, { controller: 'adminRole', action: 'viewUser', discriminator: 'affiliate' });
	routeGet(routes.manageTeamUsers, { controller: 'adminRole', action: 'manageUsers', discriminator: 'team' });
	routeGet(routes.viewTeamUser, { controller: 'adminRole', action: 'viewUser', discriminator: 'team' });
	routeGet(routes.editTeamRoles, { controller: 'adminRole', action: 'editRoles', discriminator: 'team' });
	app.post(routes.editTeamRoles.url, { controller: 'adminRole', action: 'saveRoles', discriminator: 'team' });
	routeGet(routes.manageDivisionUsers, { controller: 'adminRole', action: 'manageUsers', discriminator: 'division' });
	routeGet(routes.viewDivisionUser, { controller: 'adminRole', action: 'viewUser', discriminator: 'division' });
	routeGet(routes.editDivisionRoles, { controller: 'adminRole', action: 'editRoles', discriminator: 'division' });
	app.post(routes.editDivisionRoles.url, { controller: 'adminRole', action: 'saveRoles', discriminator: 'division' });
	routeGet(routes.competitionEmailUsers, { controller: 'adminCompetition', action: 'emailUsers' });
	app.post(routes.competitionEmailUsers.url, { controller: 'adminCompetition', action: 'sendEmailToUsers' });
	routeGet(routes.manageCompetitionUsers, { controller: 'adminRole', action: 'manageUsers', discriminator: 'competition' });
	routeGet(routes.viewCompetitionUser, { controller: 'adminRole', action: 'viewUser', discriminator: 'competition' });
	routeGet(routes.editCompetitionRoles, { controller: 'adminRole', action: 'editRoles', discriminator: 'competition' });
	app.post(routes.editCompetitionRoles.url, { controller: 'adminRole', action: 'saveRoles', discriminator: 'competition' });
	routeGet(routes.editCompetitionUser, { controller: 'adminRole', action: 'editUser', discriminator: 'competition' });
	app.post(routes.editCompetitionUser.url, { controller: 'adminRole', action: 'saveUser', discriminator: 'competition' });

	app.post(routes.resetUserPassword.url, { controller: 'adminUser', action: 'resetPassword' });

	routeGet(routes.activeCompetitions, { controller: 'competition', action: 'active' });

	routeGet(routes.editGameScore, { controller: 'game', action: 'editScore' });
	app.post(routes.postGameScore.url, { controller: 'game', action: 'postScore' });
	routeGet(routes.editGameRoster, { controller: 'game', action: 'editGameRoster' });
	app.post(routes.editGameRoster.url, { controller: 'game', action: 'saveGameRoster' });
	routeGet(routes.editBattingStats, { controller: 'game', action: 'editStats', type: 'Batting' });
	app.post(routes.editBattingStats.url, { controller: 'game', action: 'saveStats', type: 'Batting' });
	routeGet(routes.editPitchingStats, { controller: 'game', action: 'editStats', type: 'Pitching' });
	app.post(routes.editPitchingStats.url, { controller: 'game', action: 'saveStats', type: 'Pitching' });
	routeGet(routes.gameDetails, { controller: 'game', action: 'details' });
	routeGet(routes.taxiPoolRequest, { controller: 'game', action: 'taxiPoolRequest' });
	app.post(routes.taxiPoolRequest.url, { controller: 'game', action: 'createTaxiPoolRequest' });
	routeGet(routes.viewTaxiPoolRequest, { controller: 'game', action: 'viewTaxiPoolRequest' });
	app.post(routes.cancelTaxiPoolRequest.url, { controller: 'game', action: 'cancelTaxiPoolRequest' });
	routeGet(routes.acceptTaxiPoolInvite, { controller: 'game', action: 'updateTaxiPoolInvite', status: 'accepted' });
	routeGet(routes.declineTaxiPoolInvite, { controller: 'game', action: 'updateTaxiPoolInvite', status: 'declined' });
	app.post(routes.deleteGameParticipant.url, { controller: 'game', action: 'deleteGameParticipant' });

	routeGet(routes.fieldList, { controller: 'field', action: 'list' });
	routeGet(routes.fieldDetails, { controller: 'field', action: 'details' });

	routeGet(routes.registeredPlayersList,     { controller: 'players', action: 'registered' });
	routeGet(routes.poolPlayersList,           { controller: 'players', action: 'playerPool' });
	routeGet(routes.taxiPlayersList,           { controller: 'players', action: 'taxiPool' });
	routeGet(routes.editTaxiPoolEntry,         { controller: 'players', action: 'editTaxiPoolEntry' });
	app.post(routes.editTaxiPoolEntry.url,     { controller: 'players', action: 'saveTaxiPoolEntry' });
	routeGet(routes.playerPoolEntryDetails,    { controller: 'players', action: 'playerPoolDetails' });
	routeGet(routes.editPlayerPoolEntry,       { controller: 'players', action: 'editPlayerPoolEntry' });
	app.post(routes.editPlayerPoolEntry.url,   { controller: 'players', action: 'savePlayerPoolEntry' });
	app.post(routes.draftPlayerImage.url,      { controller: 'players', action: 'savePlayerPoolImage' });
	app.post(routes.setBib.url,                { controller: 'players', action: 'setBib' });

	app.post(routes.deletePlayerPoolEntry.url, { controller: 'registration', action: 'deletePlayerPoolEntry' });
	app.post(routes.deleteTaxiPoolEntry.url, { controller: 'registration', action: 'deleteTaxiPoolEntry' });
	app.post(routes.unregisterFromTeam.url, { controller: 'registration', action: 'unregisterFromTeam' });
	app.post(routes.unregisterFromCompetition.url, { controller: 'registration', action: 'unregisterFromCompetition' });
	app.post(routes.changeRosterStatus.url, { controller: 'registration', action: 'changeRosterStatus' });
	routeGet(routes.register, { controller: 'registration', action: 'splash' });
	routeGet(routes.registerChoose, { controller: 'registration', action: 'choose' });
	routeGet(routes.registerJoin, { controller: 'registration', action: 'join' });
	routeGet(routes.registerCreateTeam, { controller: 'registration', action: 'createTeam' });
	routeGet(routes.registerWaiver, { controller: 'registration', action: 'waiver' });
	routeGet(routes.registerPool, { controller: 'registration', action: 'pool' });
	routeGet(routes.registerTaxi, { controller: 'registration', action: 'taxi' });
	routeGet(routes.registerPay, { controller: 'registration', action: 'pay' });
	app.post(routes.register.url + '/create', { controller: 'account', action: 'createAccount' });
	app.post(routes.registerPool.url, { controller: 'registration', action: 'registerForPlayerPool' });
	app.post(routes.registerCreateTeam.url, { controller: 'registration', action: 'createNewTeam' });
	app.post(routes.registerJoin.url, { controller: 'registration', action: 'joinTeam' });
	app.post(routes.registerWaiver.url, { controller: 'registration', action: 'agreeToWaiver' });
	app.post(routes.registerTaxi.url, { controller: 'registration', action: 'handleTaxiPoolDecision' });
	app.post(routes.registerPay.url, { controller: 'registration', action: 'processPayment' });
	routeGet(routes.teamInvitationRedemption, { controller: 'registration', action: 'processTeamInvitation' });
	app.get(routes.emailTest.url, { controller: 'registration', action: 'emailTest' });

	routeGet(routes.login, { controller: 'account', action: 'login' });
	app.post(routes.login.url, { controller: 'account', action: 'loginPost' });
	app.get(routes.logout.url, { controller: 'account', action: 'logout' });
	routeGet(routes.profile, { controller: 'account', action: 'profile' });
	routeGet(routes.preferences, { controller: 'account', action: 'preferences' });
	app.post(routes.preferences.url, { controller: 'account', action: 'savePreferences' });
	routeGet(routes.changePassword, { controller: 'account', action: 'changePassword' });
	app.post(routes.changePassword.url, { controller: 'account', action: 'changePasswordTo' });
	routeGet(routes.profileEdit, { controller: 'account', action: 'profileEdit' });
	app.post(routes.profileEdit.url, { controller: 'account', action: 'profileSave' });
	routeGet(routes.resetPassword, { controller: 'account', action: 'resetPassword' });
	app.post(routes.resetPassword.url, { controller: 'account', action: 'createResetPasswordToken' });
	routeGet(routes.resetPasswordReturn, { controller: 'account', action: 'resetPasswordReturn', discriminator: 'password' });
	app.post(routes.resetPasswordReturn.url, { controller: 'account', action: 'resetPasswordTo', discriminator: 'password' });

	app.get(routes.mainMenuInfo.url, { controller: 'mainMenu', action: 'info' });
	routeGet(routes.playerDetails, { controller: 'players', action: 'playerDetails' });
	routeGet(routes.playerStatsCompetition, { controller: 'players', action: 'competitionStatsGameLog' });
	routeGet(routes.tos, { controller: 'home', action: 'tos' });
	routeGet(routes.competitionDefinitionDetails, { controller: 'competition', action: 'definitionDetails' });
	routeGet(routes.competitionDetails, { controller: 'competition', action: 'details' });
	routeGet(routes.divisionDetails, { controller: 'division', action: 'details' });
	routeGet(routes.divisionSchedule, { controller: 'division', action: 'schedule' });
	routeGet(routes.divisionStandings, { controller: 'division', action: 'standings' });
	routeGet(routes.divisionBattingStats, { controller: 'division', action: 'stats', type: 'Batting', scope: 'User' });
	routeGet(routes.divisionPitchingStats, { controller: 'division', action: 'stats', type: 'Pitching', scope: 'User' });
	routeGet(routes.divisionTeamBattingStats, { controller: 'division', action: 'stats', type: 'Batting', scope: 'Team' });
	routeGet(routes.divisionTeamPitchingStats, { controller: 'division', action: 'stats', type: 'Pitching', scope: 'Team' });
	routeGet(routes.teamDetails, { controller: 'team', action: 'details' });
	routeGet(routes.teamRoster, { controller: 'team', action: 'roster' });
	routeGet(routes.teamSchedule, { controller: 'team', action: 'schedule' });
	routeGet(routes.teamBattingStats, { controller: 'team', action: 'stats', type: 'Batting' });
	routeGet(routes.teamPitchingStats, { controller: 'team', action: 'stats', type: 'Pitching' });

	routeGet(routes.notFound, { controller: 'error', action: 'notFound' });

	//set up error routes
	var errorRoutes = {
		'400': routes.badRequest,
		'401': routes.unauthorized,
		'403': routes.forbidden,
		'404': routes.notFound,
		'500': routes.serverError
	};

	container.registerInstance(errorRoutes, 'ErrorRoutes', lifetime.memory());
	next();
};
