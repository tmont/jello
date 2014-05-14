(function(window, $) {
	var loadingClass = 'loading';

	function Button($button) {
		this.$element = $button;
		this.originalState = {
			className: this.$element[0].className,
			disabled: this.$element.attr('disabled'),
			content: this.$element.html()
		};
	}

	Button.prototype = {
		destroy: function() {
			this.$element.data('button', null);
		},

		disable: function() {
			this.$element.attr('disabled', true).addClass('disabled');
		},

		enable: function() {
			this.$element.removeAttr('disabled').removeClass('disabled');
		},

		updateAndReplace: function(className, options) {
			this.$element.removeClass('btn-success btn-danger loading').addClass(className).attr('disabled', true);
			if (options) {
				if (options.content) {
					this.$element.html(options.content);
				}
				if (options.timeout !== false) {
					window.setTimeout($.proxy(this.reset, this), options.timeout || 2000);
				}
			}
		},

		success: function(options) {
			options = options || {};
			if (!options.content) {
				options.content = '<i class="fa fa-check"></i>Saved!';
			}
			this.updateAndReplace('btn-success', options);
		},

		error: function(options) {
			options = options || {};
			if (!options.content) {
				options.content = '<i class="fa fa-exclamation-circle"></i>Error!';
			}
			this.updateAndReplace('btn-danger', options);
		},

		loading: function() {
			this.disable();
			this.$element
				.addClass(loadingClass)
				.append($('<div/>').addClass(loadingClass));
		},

		reset: function() {
			this.$element.find('.' + loadingClass).remove();
			this.$element.removeClass(loadingClass);
			this.$element[0].className = this.originalState.className;
			this.$element.html(this.originalState.content);
			if (this.originalState.disabled) {
				this.$element.attr('disabled', true);
			} else {
				this.$element.removeAttr('disabled');
			}
		}
	};

	$.fn.button = function(method, options) {
		this.each(function() {
			var $element = $(this),
				button = $element.data('button');
			if (!button) {
				$element.data('button', (button = new Button($element)));
			}

			button[method] && button[method](options);
		});

		return this;
	};
}(window, jQuery));