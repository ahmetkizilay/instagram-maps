$(document).ready(function () {"use strict";
	var map,
	    markerArray = [],
	    mapOptions = {
			zoom : 13,
			center : new google.maps.LatLng(41.02, 28.97),
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			disableDoubleClickZoom : true
		},
		pnlWait = $("#pnlWait"),
		pnlCopyLink = $("#pnlCopyLink"),
		txtCopyLink = $("#txtCopyLink"),
		txtCopyLinkLong = $("#txtCopyLinkLong"),
		win = $(window),
		win_height = win.height(),
		win_width = win.width(),
		btnCopyLink = $("#btnCopyLink"),
		pnlViewImg = $(".img-view-panel"),
		imgImgHolder = $(".img-container>img"),
		pnlInfo = $("#pnlInfo"),

		getQueryParams = function (qs) {
			var str = qs.split('+').join(' '),
				params = {},
				tokens,
				rgx = /[?&]?([^=]+)=([^&]*)/g;

			while(tokens = rgx.exec(str)) {
				params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
			}

			return params;
		},

		queryId = getQueryParams(document.location.search).q,

		hidePnlViewImg = function (event) {
			pnlViewImg.hide();
			window.history.replaceState({}, null, window.location.pathname);
		},

		handleURLSuccess = function(res) {

			pnlWait.hide();
			if(res.id) {
				txtCopyLink.val(res.id);
				txtCopyLink.focus().select();
			}
			else {
				txtCopyLink.val("oops error... try again");
			}
		},

		handleURLFail = function(res) {
			pnlWait.hide();

			txtCopyLink.val("oops error... try again");

			console.log("url fail");
			console.log(res);
		},

		copyLinkClickedLong = function(link, id) {
			pnlCopyLink.css('display', 'table');
			txtCopyLink.val(link);
			txtCopyLinkLong.val(window.location.pathname + '?q=' + id);
			txtCopyLinkLong.focus().select();
		},
		copyLinkClicked = function (id) {
			pnlWait.show();

			txtCopyLink.val("shortening..");
			pnlCopyLink.css('display', 'table');

			$.ajax({
				type : "GET",
				url : "url?q=" + id,
				dataType : "json"
			}).done(handleURLSuccess).fail(handleURLFail);
		},

		markerClicked = function (data) {

			pnlViewImg.hide();
			imgImgHolder.attr('src', '');

			pnlViewImg.show();
			pnlWait.show();

			imgImgHolder.attr('src', data.images.standard_resolution.url)
						.load(function () {
							pnlWait.hide();
						}).click(hidePnlViewImg);

			btnCopyLink.unbind('click.copylink');
			btnCopyLink.bind('click.copylink', function() { copyLinkClickedLong(data.link, data.id); });
			window.history.replaceState({}, null, window.location.pathname + '?q=' + data.id);
			//btnCopyLink.bind('click.copylink', function() { copyLinkClicked(data.id); });

		}, createMarker = function (data) {
		var location = new google.maps.LatLng(data.location.latitude, data.location.longitude), icon = {
			url : data.images.thumbnail.url,
			size : new google.maps.Size(30, 30)
		}, marker_options = {
			position : location,
			map : map,
			icon : icon
		}, thisMarker = new google.maps.Marker(marker_options);

		google.maps.event.addListener(thisMarker, "click", function () {
			markerClicked(data);
		});

		markerArray.push(thisMarker);
	}, handleSuccessResponse = function (res) {
		//console.log(res);
		var i, data = res.data, len = data.length;

		for (i = 0; i < len; i = i + 1) {
			createMarker(data[i]);
		}

		pnlWait.hide();

	}, handleFailResponse = function (jqxhr, status) {
		console.log("error: " + status);
	}, sendQuery = function (lat, lng) {
		pnlWait.show();
		$.ajax({
			type : "GET",
			url : "https://api.instagram.com/v1/media/search",
			data : {
				lat : lat,
				lng : lng,
				client_id : 'de68db96a1f94e1596b6803bebd6c8c0',
				distance : 5000
			},
			dataType : "jsonp"
		}).done(handleSuccessResponse).fail(handleFailResponse);
	}, clearEverything = function () {
		while (markerArray.length > 0) {
			markerArray.pop().setMap(null);
		}
		pnlViewImg.hide(); pnlCopyLink.hide(); pnlWait.hide(); pnlInfo.hide();
		window.history.replaceState({}, null, window.location.pathname);
	}, handleOneImageSuccess = function (res) {
		console.log(res);
		if (res.meta.code !== 200) {
			console.log("Could Not Find query");
			return;
		}

		if (!res.data.location) {
			console.log("There is no location");
			return;
		}

		createMarker(res.data);
		markerClicked(res.data);

		map.panTo(new google.maps.LatLng(res.data.location.latitude, res.data.location.longitude));

	}, handleOneImageFail = function (jqxhr, status) {
		console.log("error: " + status);
	}, bringOneImage = function (id) {
		$.ajax({
			type : "GET",
			url : "https://api.instagram.com/v1/media/" + id,
			data : {
				client_id : '683b547355b843baaddedb6559e2fc23'
			},
			dataType : "jsonp"
		}).done(handleOneImageSuccess).fail(handleOneImageFail);
	};

	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	google.maps.event.addListener(map, 'click', function(event) {
		hidePnlViewImg();
		pnlInfo.hide();
	});

	google.maps.event.addListener(map, 'dblclick', function (event) {
		sendQuery(event.latLng.lat(), event.latLng.lng());
	});

	if(navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(function(position) {
	      var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
	      map.panTo(initialLocation);
	      console.log("got your loc");
	    }, function() {
	    	console.log("no location");
	    });
  	}

	pnlViewImg.css('top', (win_height * 0.5) - 250).css('left', (win_width * 0.5) - 250);
	$(".circle-button").click(hidePnlViewImg);
	btnCopyLink.css('top', '460px').css('left', '410px');

	pnlWait.css('top', (win_height * 0.5) - 10).css('left', (win_width * 0.5) - 62);
	pnlCopyLink.css('top', (win_height * 0.5) - 20).css('left', (win_width * 0.5) - 125);
	$("#btnCloseCopyLink").click(function () {
		txtCopyLink.val("");
		pnlCopyLink.hide();
	});

	$("#pnlClear").css('top', (win_height - 60) + 'px').css('left', '20px').click(clearEverything);

	pnlInfo.css('top', (win_height * 0.5) - 150)
		   .css('left', (win.width() * 0.5) - 250)
		   .click(function () {
		     pnlInfo.hide();
		   });

	$("#pnlTrigInfo").css('top', (win_height - 60) + 'px').css('left', '120px').click(function () {pnlInfo.show()});

	// if there is a param entered, retrieve it
	if (queryId) {
		bringOneImage(queryId);
	}
	else {
		$("#pnlInitInstr").css('top', ((win_height * 0.5) - 20) + 'px')
						  .css('left', ((win_width * 0.5) - 250) + 'px')
						  .show().fadeOut(5000);
	}

    });
