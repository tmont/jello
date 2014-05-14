!function($) {

	var app = window.jello;

	function Confirm($element, options) {
		this.$element = $element;
		this.action = options.action;
		this.redirectUrl = options.redirectUrl;
		this.onConfirm = options.onConfirm;
		this.onSuccess = options.onSuccess;
		this.onError = options.onError;
		this.title = options.title;
		this.description = options.description;
		this.successConfirm = options.successConfirm;
		this.init();
	}

	Confirm.prototype = {
		init: function() {
			var self = this;

			function confirm() {
				if (self.$element.is('[disabled]')) {
					return;
				}

				if (self.onConfirm) {
					self.onConfirm();
					return;
				}

				self.hide();
				self.$element.button('loading');

				var options = {
					data: { _csrf: self.$element.data('csrf') }
				};

				app.request.post(self.action, options, function(err, result) {
					if (err) {
						if (self.onError) {
							self.onError(err);
							return;
						}

						self.$element.button('reset');
						app.showSiteError(err.message);
						return;
					}

					if (self.redirectUrl) {
						app.navigate(self.redirectUrl || '/');
					} else if (self.onSuccess) {
						self.onSuccess(result);
					}
				});
			}

			function cancel() {
				self.$element.popover('hide');
			}

			var btnClass = this.successConfirm ? 'btn-success' : 'btn-danger';
			var $content = $('<div/>').addClass('confirm-content')
				.append($('<div/>').addClass('btn-group')
					.append($('<button/>').addClass('btn btn-sm ' + btnClass).click(confirm)
						.append($('<span/>').addClass('fa fa-check-circle'))
						.append($('<span/>').addClass('btn-content').text('Yes')))
					.append($('<button/>').addClass('btn btn-default btn-sm cancel').click(cancel)
						.append($('<span/>').addClass('fa fa-times-circle'))
						.append($('<span/>').addClass('btn-content').text('No'))));

			if (this.description) {
				$content.prepend(this.description);
			}

			this.$element.popover({
				animation: false,
				container: 'body',
				trigger: 'click',
				placement: 'top',
				html: true,
				title: this.title || 'Are you sure?',
				content: $content
			});
		},

		show: function() {
			this.$element.popover('show');
		},

		hide: function() {
			this.$element.popover('hide');
		},

		destroy: function() {
			this.$element.popover('destroy');
		}
	};

	$.fn.confirm = function(options) {
		return this.each(function() {
			var $element = $(this),
				confirm = $element.data('confirm');

			if (!confirm) {
				$element.data('confirm', (confirm = new Confirm($element, options || {})));
			}

			if (typeof(options) === 'string' && typeof(confirm[options]) === 'function') {
				confirm[options]();
			}
		});
	}

}(window.jQuery);
