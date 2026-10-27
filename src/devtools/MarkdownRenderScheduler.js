define(function() {

	class MarkdownRenderScheduler {
		constructor(options) {
			options = options || {};
			this.quietPeriod = options.quietPeriod || 750;
			this.maxDelay = options.maxDelay || 2500;
			this.now = options.now || (() => Date.now());
			this.setTimer = options.setTimeout || ((callback, delay) => setTimeout(callback, delay));
			this.clearTimer = options.clearTimeout || (id => clearTimeout(id));
			this.render = options.render || (() => {});
			this.timer = null;
			this.dirtySince = null;
			this.lastActivity = null;
			this.payload = null;
		}

		isPending() {
			return this.dirtySince !== null;
		}

		dirty(payload) {
			const now = this.now();
			if(this.dirtySince === null) {
				this.dirtySince = now;
			}
			this.lastActivity = now;
			this.payload = payload;
			this.schedule();
		}

		activity() {
			if(this.dirtySince === null) return;

			this.lastActivity = this.now();
			this.schedule();
		}

		nextAt() {
			return Math.min(
				this.lastActivity + this.quietPeriod,
				this.dirtySince + this.maxDelay
			);
		}

		schedule() {
			if(this.timer !== null) {
				this.clearTimer(this.timer);
			}
			const delay = Math.max(0, this.nextAt() - this.now());
			this.timer = this.setTimer(() => {
				this.timer = null;
				if(this.now() < this.nextAt()) {
					this.schedule();
					return;
				}
				this.flush(this.now() >= this.dirtySince + this.maxDelay ? "max-delay" : "quiet");
			}, delay);
		}

		flush(reason) {
			if(this.dirtySince === null) return false;
			if(this.timer !== null) {
				this.clearTimer(this.timer);
				this.timer = null;
			}

			const payload = this.payload;
			this.dirtySince = null;
			this.lastActivity = null;
			this.payload = null;
			this.render(payload, reason || "flush");
			return true;
		}

		cancel() {
			if(this.timer !== null) {
				this.clearTimer(this.timer);
			}
			this.timer = null;
			this.dirtySince = null;
			this.lastActivity = null;
			this.payload = null;
		}
	}

	return MarkdownRenderScheduler;
});
