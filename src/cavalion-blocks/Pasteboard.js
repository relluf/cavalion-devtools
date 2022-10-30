/*- 

# Keeps track of pasted images

## TODO
* It would be nice to see some sort of feedback when Cmd+V is pressed, it's kinda slow with large images
	* Are you kiddin' me? => app.toast({content:"Image pasted", classes: "glassy fade", timeout: 2500})

## Log

### 2021/01/09
- Press Alt+[Cmd+]V to make it appear 

*/

function retrieveImageFromClipboardAsBase64(pasteEvent, callback, imageFormat){
/**
 * This handler retrieves the images from the clipboard as a base64 string and returns it in a callback.
 * https://stackoverflow.com/questions/60503912/get-image-using-paste-from-the-browser
 * 
 * @param pasteEvent 
 * @param callback 
 */

    if(pasteEvent.clipboardData == false){
        if(typeof(callback) == "function"){
            callback(undefined);
        }
    }

    // retrive elements from clipboard
    var items = pasteEvent.clipboardData.items;

    if(items == undefined){
        if(typeof(callback) == "function"){
            callback(undefined);
        }
    }
    // loop the elements
    for (var i = 0; i < items.length; i++) {
        // Skip content if not image
        if (items[i].type.indexOf("image") == -1) continue;
        // Retrieve image on clipboard as blob
        var blob = items[i].getAsFile();

        // Create an abstract canvas and get context
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext('2d');

        // Create an image
        var img = new Image();

        // Once the image loads, render the img on the canvas
        img.onload = function(){
            // Update dimensions of the canvas with the dimensions of the image
            canvas.width = this.width;
            canvas.height = this.height;

            // Draw the image
            ctx.drawImage(img, 0, 0);

            // Execute callback with the base64 URI of the image
            if(typeof(callback) == "function"){
                callback(canvas.toDataURL(
                    (imageFormat || "image/png")
                ), img, canvas);
            }
        };

        // Crossbrowser support for URL
        var URLObj = window.URL || window.webkitURL;

        // Creates a DOMString containing a URL representing the object given in the parameter
        // namely the original Blob
        img.src = URLObj.createObjectURL(blob);
    }
}
function handler(evt, owner) {
	var preview = owner.scope().preview;
	// preview.addClass("loading");
	retrieveImageFromClipboardAsBase64(evt, (imageDataBase64, img, canvas) => {
	    if(imageDataBase64){
	    	var node = preview.getNode();
	    	node.insertBefore(img, node.childNodes[0] || null);
	    	img.dataset.time = Date.now();
			app.toast({content:"Image pasted", classes: "glassy fade", timeout: 2500});
		}
		// preview.removeClass("loading");
	});
}

["Container", { 
	classes: "glassy-overlay",
	css: {
		"": "z-index: 9999;"
	},
	onNodeCreated() { this._node.style.margin = "0"; },
	onDestroy() {
		document.removeEventListener("paste", this.vars("listener"));
	},
	onLoad() {
		document.addEventListener(
			"paste", 
			this.vars("listener", evt => handler(evt, this)), 
			true);

		// because devtools/Editor<blocks> will mess with the parent as well
		this.nextTick(() => this.setParent(this.app().down("#window")));
	}
}, [
	["Executable", ("toggles-visible"), {
		state: false,
		visible: "state",
		hotkey: "Alt+Cmd+V",
		on(evt) { this.toggle(); }		
	}],
	["Container", ("preview"), {
		action: "toggles-visible",
		align: "right", 
		width: 600,
		executesAction: false,
		classes: "glassy no-margin with-shadow d",
		css: {
			"": "text-align:center;",
			"&.d.d": "margin:0;",
			"img": "max-width:75%;margin:32px;",
			"div": "margin:8px;",
			"&.loading.loading.loading": "background-position-y: 8px;"
		}
	}]
]];