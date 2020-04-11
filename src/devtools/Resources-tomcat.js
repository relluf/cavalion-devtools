/*-

### 2018-02
- Starting to use Markdown

### 2018-01
- Porting back-end to Node
- Porting to Promise/then

*/
define(function(require) {

	var $ = require("jquery");
	var js = require("js");
	var Deferred = require("js/Deferred");

	var BASE_URL = "/stuv/rest/resources/";

	function deferred(request) {
		var r = new Deferred();
		request.then(function() {
			r.callback.apply(r, arguments);
		}).fail(function() {
			var message = request.status + " - " + request.statusText;
			var error = js.mixIn(new Error(message), {
				request: request,
				responseJSON: request.responseJSON,
				responseText: request.responseText,
				status: request.status
			});
			r.errback(error);
		});
		return r;
	}

	function adjust(uri) {
		return BASE_URL + (window.escape(uri) || "");
	}

	return {

		index: function(uris) {
			return deferred($.ajax(adjust("index") + "?uris=" +
					window.escape(uris.join(";"))));
		},

		list: function(uri) {
			// var params = "?list";
			// if(uri.indexOf(".page") === uri.length - 5) {
				
			// }
			return deferred($.ajax(adjust(uri) + "?list=all"))
				.addCallback(function(res) {
					res.forEach(function(resource) {
						// console.log(resource.name);
						resource.uri = uri + "/" + resource.name;
					});
					return res;
				});
		},

		get: function(uri) {
			return deferred($.ajax(adjust(uri) + "?list=false"));
		},

		create: function(uri, resource) {
			return deferred($.ajax(adjust(uri), {
				method: "POST",
				contentType: "application/json",
				data: JSON.stringify({
					"text": resource.text,
					"revision": resource.revision,
					"position": 0
				})
			}));
		},
		
		'delete': function(uri) {
		    return deferred($.ajax(adjust(uri), {
		        method: "DELETE"
		    }));
		},

		update: function(uri, resource) {
			return deferred($.ajax(adjust(uri), {
				method: "PUT",
				contentType: "application/json",
				data: JSON.stringify({
					"text": resource.text,
					"revision": resource.revision,
					"position": 0
				})
			}));
		}
	};

});