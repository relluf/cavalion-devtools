define(function(require) {
	var same = (a, b) => a !== undefined && a !== null && a === b;

	return function RemoteResourceMonitor(options) {
		options = options || {};
		var interval = options.interval || 5000;
		var active = false;
		var destroyed = false;
		var timer = null;
		var pending = null;
		var revision = options.revision;
		var observedRevision = null;
		var lastError = null;

		var clearTimer = () => {
			if(timer !== null) {
				(options.clearTimeout || clearTimeout)(timer);
				timer = null;
			}
		};
		var schedule = () => {
			clearTimer();
			if(active && !destroyed) {
				timer = (options.setTimeout || setTimeout)(() => {
					timer = null;
					check().then(schedule, schedule);
				}, interval);
			}
		};
		var reportError = error => {
			var key = String(error && (error.stack || error.message) || error);
			if(key !== lastError) {
				lastError = key;
				(options.onError || console.warn)(error);
			}
		};
		var check = () => {
			if(!active || destroyed) return Promise.resolve();
			if(pending) return pending;

			pending = Promise.resolve().then(options.getRevision).then(remoteRevision => {
				lastError = null;
				if(destroyed || !active || remoteRevision === undefined || remoteRevision === null) return;
				if(revision === undefined || revision === null) {
					revision = remoteRevision;
					return;
				}
				if(same(revision, remoteRevision)) {
					observedRevision = null;
					return;
				}
				if(same(observedRevision, remoteRevision)) return;

				observedRevision = remoteRevision;
				return Promise.resolve(options.confirm(options.isDirty && options.isDirty(), remoteRevision))
					.then(reload => {
						if(reload !== true || destroyed || !active) return;
						return Promise.resolve(options.reload(remoteRevision)).then(() => {
							revision = remoteRevision;
							observedRevision = null;
						});
					});
			}).catch(reportError).then(() => {
				pending = null;
			});
			return pending;
		};

		this.start = () => {
			if(destroyed) return Promise.resolve();
			active = true;
			clearTimer();
			return check().then(schedule, schedule);
		};
		this.stop = () => {
			active = false;
			clearTimer();
		};
		this.destroy = () => {
			destroyed = true;
			this.stop();
		};
		this.check = check;
		this.remember = value => {
			revision = value;
			observedRevision = null;
		};
		this.refreshRevision = () => {
			if(destroyed) return Promise.resolve();
			if(pending) return pending.then(() => this.refreshRevision());
			pending = Promise.resolve().then(options.getRevision).then(remoteRevision => {
				lastError = null;
				if(remoteRevision !== undefined && remoteRevision !== null) {
					revision = remoteRevision;
					observedRevision = null;
				}
			}).catch(reportError).then(() => {
				pending = null;
			});
			return pending;
		};
		this.isActive = () => active && !destroyed;
		this.getRevision = () => revision;
	};
});
