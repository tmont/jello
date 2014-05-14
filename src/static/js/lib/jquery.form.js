(function(window, document, $) {

	var validators = {
		required: {
			message: 'This field is required',
			test: function(value, _, callback) {
				callback(!!value);
			}
		},
		minLength: {
			message: 'Must be at least %s characters',
			test: function(value, length, callback) {
				var min = parseInt(length);

				if (isNaN(min)) {
					min = -Infinity;
				}

				callback(value.length >= min);
			}
		},
		maxLength: {
			message: 'Cannot be more than %s characters',
			test: function(value, length, callback) {
				var max = parseInt(length);
				if (isNaN(max)) {
					max = Infinity;
				}
				callback(value.length <= max);
			}
		},
		money: {
			message: 'Not a valid amount',
			test: function(value, _, callback) {
				callback(/^(\d+)\.?(\d+)?$/.test(value));
			}
		},
		greaterThanZero: {
			message: 'Must be a number greater than zero',
			test: function(value, _, callback) {
				callback(/^[1-9]\d*$/.test(value));
			}
		},
		gteZero: {
			message: 'Must be a number greater than or equal to zero',
			test: function(value, _, callback) {
				callback(/^[0-9]\d*$/.test(value));
			}
		},
		regex: {
			message: 'Must match %s',
			test: function(value, regex, callback) {
				callback(new RegExp(regex).test(value));
			}
		},
		email: {
			message: 'Must be a valid email address',
			test: function(value, _, callback) {
				callback(/.+@.+\..+/.test(value));
			}
		},
		date: {
			message: 'Must be a valid date',
			test: function(value, _, callback) {
				callback(moment(value).isValid());
			}
		},
		time: {
			message: 'Must be a valid time',
			test: function(value, _, callback) {
				callback(/\d\d?:\d\d(:\d\d)?(\s*[ap]m?)?/i.test(value));
			}
		},
		phone: {
			message: 'Must be a valid phone number (including area code)',
			test: function(value, _, callback) {
				//it's valid if it has 10 numbers
				callback(value.replace(/\D/g, '').length === 10);
			}
		},
		match: {
			message: 'Must match the "%s" field',
			test: function(value, fieldName, callback) {
				callback(value === trim($('[name="' + fieldName + '"]').val()));
			}
		}
	};

	function trim(string) {
		return $.trim(string).toString();
	}

	function Form($element, options) {
		this.url = options.url || $element.data('action') || $element.attr('action') || window.location.pathname;
		this.$element = $element;
		this.method = (options.method || this.$element.data('method') || $element.attr('method') || 'post').toLowerCase();
		this.$submit = options.$submit || this.$element.find('.submit-input');
		this.prefix = options.prefix;
		this.noReset = !!options.noReset;
		this.successContent = options.successContent || null;
		this.failContent = options.failContent || null;
		this.noButtonResult = !!options.noButtonResult;
		this.transformer = options.transformer;
		this.onSubmit = options.onSubmit;
		this.submitting = false;
		var prefixRegex = new RegExp('^' + this.prefix);

		var self = this;

		this.$element.submit(function(e) {
			//prevent default form action
			e.preventDefault();
			e.stopPropagation();
			return false;
		});

		// purposely omitting textareas because you're allowed to
		// press enter inside of them
		this.$submit.add(this.$element.find('input,select')).keyup(function(e) {
			if (prefixRegex.test(this.getAttribute('name'))) {
				if (e.keyCode === 13) {
					self.submit();
				}
			}
		});
		this.$element.find('input,select,textarea')
			.blur(function() {
				self.validate($(this));
			});
		this.$submit.click(function() {
			self.submit();
		});
	}

	Form.prototype = {
		validate: function($elements, callback) {
			if (typeof($elements) === 'function') {
				callback = $elements;
				$elements = null;
			}

			callback = callback || function() {};

			$elements = $elements || this.$element.find('input,textarea,select');

			var elementValidators = [];

			$elements.each(function() {
				var $element = $(this),
					type = $element.attr('type'),
					value = type === 'checkbox' ? $element.is(':checked') : trim($element.val()),
					data = $element.data(),
					tests = [],
					optional = !('required' in data);
				$element.hideValidationMessage();

				function validate(validator, validationValue, type) {
					return function(callback) {
						validator.test(value, validationValue, function(isValid) {
							callback(isValid
								? null
								: $element.attr('data-' + type + '-message') ||
									validator.message.replace('%s', validationValue)
							);
						});
					}
				}

				// only validate if it's a required field, or it's optional AND
				// they actually input something
				if (!optional || !!value) {
					$.each(data, function(type, validationValue) {
						var validator = validators[type];
						if (!validator) {
							return;
						}

						tests.push(validate(validator, validationValue, type));
					});

					var typeMap = {
						email: 'email',
						tel: 'phone',
						date: 'date',
						datetime: 'datetime'
					};

					var validatorType = typeMap[type];
					if (validatorType) {
						tests.push(validate(validators[validatorType], value, type));
					}
				}

				var customValidators = $.map($element.data('customValidators') || [], function(validator) {
					return validate(validator, null, type);
				});

				elementValidators.push({
					$element: $element,
					tests: tests.concat(customValidators)
				});
			});

			//run all element validators simultaneously, but the individual tests
			//for each element need to run sequentially

			function validateElement(data, callback) {
				data.$element.hideValidationMessage();
				function runValidator(i) {
					var validator = data.tests[i];
					if (!validator) {
						//all validators passed!
						callback(true);
						return;
					}

					validator(function(message) {
						if (message) {
							//validation failed
							data.$element.showValidationMessage(message);
							callback(false);
							return;
						}

						//run the next validator
						//not too worried about call stack size here because
						//there won't be more than a handful of validators for
						//each element
						runValidator(++i);
					});
				}

				runValidator(0);
			}

			var completed = 0,
				expected = elementValidators.length,
				allElementsValid = true;

			if (!expected) {
				//nothing to validate
				callback(true);
				return;
			}

			for (var i = 0; i < elementValidators.length; i++) {
				validateElement(elementValidators[i], function(passed) {
					allElementsValid = allElementsValid && passed;
					completed++;
					if (completed === expected) {
						callback(allElementsValid);
					}
				});
			}
		},
		submit: function(callback) {
			var self = this;
			if (this.$submit.is('[disabled]') || this.submitting) {
				return;
			}

			this.submitting = true;

			this.validate(function(succeeded) {
				if (!succeeded) {
					self.submitting = false;
					callback && callback({ validationFailed: true });
					return;
				}

				self.hideGlobalError();

				self.$element.trigger('form:submitting');

				if (self.onSubmit) {
					self.onSubmit(submitForm);
				} else {
					submitForm();
				}

				function submitForm(err) {
					if (err) {
						self.submitting = false;
						return;
					}

					var $submit = self.$submit.button('loading'),
						options = { data: self.getData() };

					if (self.method === 'get') {
						window.jello.navigate(self.url + '?' + $.param(options.data));
						return;
					}

					window.jello.request.post(self.url, options, function(err, result) {
						self.submitting = false;
						if (!self.noReset) {
							if (!self.noButtonResult) {
								$submit.button(
									err ? 'error' : 'success',
									{ content: err ? self.failContent : self.successContent }
								);
							} else {
								$submit.button('reset');
							}
						}
						if (err) {
							self.showGlobalError(err.message || 'An error occurred');
						}

						self.$element.trigger('form:submit', [ err, result ]);
						callback && callback(err, result);
					});
				}
			});
		},
		showGlobalError: function(message) {
			window.jello.showSiteError(message);
		},
		hideGlobalError: function() {
			window.jello.hideSiteError();
		},
		getData: function() {
			var inputs = this.$element.find('input,textarea,select'),
				transformer = this.transformer,
				data = {},
				radios = {},
				prefix = this.prefix,
				self = this;

			inputs.each(function() {
				var $elem = $(this);
				if (!$elem.attr('name')) {
					return;
				}

				if (prefix && $elem.attr('name').indexOf(prefix) !== 0) {
					return;
				}

				var key = $elem.attr('name').replace(prefix, ''),
					type = $elem.attr('type'),
					value = type === 'checkbox' ? +$elem.is(':checked') : $elem.val();

				// first identify if this is a radio
				if ($elem.attr('type') === 'radio') {
					if (!radios[key]) {
						var selector = 'input[name=' + $elem.attr('name') + ']:checked';
						data[key] = transformer ? transformer(key, self.$element.find(selector).val()) :
							self.$element.find(selector).val();
						radios[key] = true;
					}
				} else if (type === 'checkbox') {
					if (value) {
						data[key] = transformer ? transformer(key, value) : value;
					}
				} else {
					data[key] = transformer ? transformer(key, value) : value;
				}
			});

			return data;
		}
	};

	$.fn.showValidationMessage = function(message) {
		this.closest('.form-group').addClass('has-error');

		var $target = this.attr('data-placement-target') ?
			this.parent().find(this.attr('data-placement-target')) : this;

		$target.attr('data-placement', this.attr('data-placement'));

		$target
			.popover({
				animation: false,
				trigger: 'manual',
				content: message,
				container: 'body'
			})
			.popover('show');

		$target.data('bs.popover').$tip
			.addClass('validation-error-message')
			.attr('title', 'Dismiss')
			.click(function() {
				$target.popover('destroy');
			});
		return this;
	};

	$.fn.hideValidationMessage = function() {
		this.closest('.form-group')
			.removeClass('has-error');

		var $target = this.attr('data-placement-target') ?
			this.parent().find(this.attr('data-placement-target')) : this;

		$target.popover('destroy');
		return this;
	};

	$.fn.form = function(options) {
		this.each(function() {
			var $this = $(this);
			var form = $this.data('form');
			if (!form) {
				form = new Form($this, options || {});
				$this.data('form', form);
			}

			if (typeof(options) === 'string') {
				form[options] && form[options]();
			}
		});

		return this;
	};

}(window, document, jQuery));