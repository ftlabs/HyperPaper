(function(){

	'use strict';

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	var trackingDescriptorLength = 256;
    var trackingMatchesShown = 30;
    var trackingBlurRadius = 5;

	tracking.Brief.N = trackingDescriptorLength;

	var canvas = document.querySelector('canvas#identifyer'),
		ctx = canvas.getContext('2d');

	var video = document.querySelector('video#camera');	
	var which = document.querySelector('div#which');

	var uuidRegex = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;

	var images = [
		// '/images/42b87c12-622c-11e6-8310-ecf0bddad227.jpg',
		'/images/562da5da-62ac-11e6-a08a-c7ac04ef00aa.jpg',
		'/images/9a05732e-62b0-11e6-8310-ecf0bddad227.jpg',
		'/images/c20190aa-6158-11e6-8310-ecf0bddad227.jpg',
		'/images/d1db712e-62ae-11e6-a08a-c7ac04ef00aa.jpg'
	].map(src => {
		
		return new Promise(function(resolve, reject){
			var i = new Image();
			
			i.onload = function(){
				resolve(i);
			}
			
			var matchedUUID = uuidRegex.exec(src); 

			i.setAttribute('data-id', matchedUUID ? matchedUUID[1] : null);
			
			i.src = src;

		});

	});

	Promise.all(images)
		.then(loadedImages => {

			console.log(loadedImages);

			loadedImages.forEach(function(img, idx){

				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);
				var data = ctx.getImageData( 0, 0, canvas.width, canvas.height );
				data.id = img.getAttribute('data-id');

				data.grey = tracking.Image.grayscale(tracking.Image.blur(data.data, img.width, img.height, trackingBlurRadius), img.width, img.height);
				data.corners = tracking.Fast.findCorners(data.grey, img.width, img.height);
				data.descriptors = tracking.Brief.getDescriptors(data.grey, img.width, data.corners);

				images[idx] = data;
			})

			startCamera();
			navigator.mediaDevices.enumerateDevices()
				.then(function(devices) {
					devices.forEach(function(device) {
						console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
					});
				})
			;

		})
	;

	function startCamera(source){
		window.removeEventListener('click', startCamera, false);
		navigator.getUserMedia({
			audio : false,
			video : {
				optional : [{
					sourceId: "1ecc0fc5c5f92dd6f5b87ef09d0dbc28df4e4a4dfa19ffadf4e24a4d95fafcd5"
				}]
			}
		}, function(stream){
			console.log("Success:", stream);

			video.src = window.URL.createObjectURL(stream);
			video.addEventListener('playing', function(){
				// Do something with the video here.
				setTimeout(function(){
					console.log("w:", video.offsetWidth, "h:", video.offsetHeight );
					canvas.width = video.offsetWidth;
					canvas.height = video.offsetHeight;

					searchForKnownImages();

				}, 1000);

			}, false);
			video.play();
			/*window.addEventListener('click', function(){
				video.play();
			}, false);*/


		}, function(err){
			console.log("Err:", err);
		})

	}
	
	function searchForKnownImages(){

		ctx.drawImage(video, 0, 0);

		// ctx.putImageData(images[0], 0, 0);

		var videoData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var videoGrey = tracking.Image.grayscale(tracking.Image.blur(videoData.data, video.offsetWidth, video.offsetHeight, trackingBlurRadius), video.offsetWidth, video.offsetHeight);
		var videoCorners = tracking.Fast.findCorners(videoGrey, video.offsetWidth, video.offsetHeight);
		var videoDescriptors = tracking.Brief.getDescriptors(videoGrey, video.offsetWidth, videoCorners);

		var best = [];

		images.forEach( (d, idx) => {
			// console.log(d.corners, d.descriptors, videoCorners, videoDescriptors);
			best[idx] = {
				id : d.id,
				matches : tracking.Brief.reciprocalMatch(d.corners, d.descriptors, videoCorners, videoDescriptors).sort(function(a, b) {return b.confidence - a.confidence;}).filter(m => {return m.confidence > 0.75})
			};
		})

		// console.log(best[0].length);

		best = best.sort(function(a,b){
			if(a.matches.length > b.matches.length){
				return -1;
			} else if(a.matches.length < b.matches.length){
				return 1;
			} else {
				return 0;
			}

		});

		if(best[0].matches.length){
			which.textContent = best[0].id + " (" + best[0].matches.length + ")";
		} else {
			which.textContent = "";
		}

		setTimeout(searchForKnownImages, 1000);

		// requestAnimationFrame(searchForKnownImages)

	}
	
}());