$(document).ready(function(){

	startUp();
	let emailAssetData = [];
	let deObjectId = [];
	let externalDEKeys = [];
	let subscriberKeys = [];
	let emails = [];
	let emailsLoaded = false
	let desLoaded = false

	function startUp() {
		$('#links').hide();
		$('#emailSelect').hide();
		$('#deSelect').hide();
		$('#updateButton').hide();
		$('#base-url-validate-entry').hide();
		$('#path-url-validate-entry').hide();
		$.ajax({
	        type: "GET",
	        url: "/getEmails",
	        success: function(res) {
	        	emailsLoaded = true;
	        	showPicklists();
	         	emailAssetData = res.body.items;
	         	if (res.body.items) {
		         	let output = `
					 	<div id="emailReplace">
						  <label class="slds-form-element__label" for="select-01">Select Email</label>
						  <div class="slds-form-element__control">
						    <div class="slds-select_container">
						      <select class="slds-select" id="emails">
						        <option value="Unselected">Please Select an Email to Validate</option>`;
				let count = 0;
	         	emailAssetData.forEach(function(item) {
	         		let name = item['name'];
	         		emails.push(item['legacyData']['legacyId']);
	         		output += `<option value=${count}>${name}</option>`;
	         		count+=1;
	         	});
	         	output += `</select>
							    </div>
							  </div>
							</div>`;


					$('#emailReplace').replaceWith(output);
				}
        	}
        });

        $.ajax({
        	type: "GET",
        	url: "/getDEs",
        	success: function(res) {
        		desLoaded = true;
        		showPicklists();
        		if (res['Results']) {
	        		let output = `
					 	<div id="deReplace">
						  <label class="slds-form-element__label" for="select-01">Select Data Extension</label>
						  <div class="slds-form-element__control">
						    <div class="slds-select_container">
						      <select class="slds-select" id="denames">
						        <option value="Unselected">Please Select a Data Extension to test against</option>`;
					let count = 0;
	        		res['Results'].forEach(function(item) {
	        			output += `<option value=${count}>${item['Name'][0]}</option>`;
	        			externalDEKeys.push(item['CustomerKey'][0]);
	        			subscriberKeys.push(item['SendableDataExtensionField'][0]['Name'][0]);
	        			deObjectId.push(item['ObjectID'][0]);
	        			count+=1;
	        		});
	        		output += `</select>
								    </div>
								  </div>
								</div>`;


					$('#deReplace').replaceWith(output);
					$('#denames').change(function() {
						$('#updateButton').hide();
						getDataExtensionSubs();
					});
				}
        	}
        });
	}

	function showPicklists() {
		if (emailsLoaded && desLoaded) {
			$('#spinna').hide();
	        $('#deSelect').show();
	        $('#emailSelect').show();
		}
	}

	function getDataExtensionSubs() {
		$('#spinna').show();
		let externalKey = externalDEKeys[$('#denames').val()];
		let sendableField = subscriberKeys[$('#denames').val()];
		$.ajax({
			type: "POST",
			url: "/getSubs",
			data: {deKey: externalKey, sendableKey: sendableField},
			success: function(res) {
				$('#spinna').hide();
				$('#updateButton').show();
				$('#base-url-validate-entry').show();
				$('#path-url-validate-entry').show();
				if (res['Results']) {
					let output = `
					 	<div id="subscribersList">
						  <label class="slds-form-element__label" for="select-01">Select Subscriber</label>
						  <div class="slds-form-element__control">
						    <div class="slds-select_container">
						      <select class="slds-select" id="subscriberIds">
						        <option value="Unselected">Select a Subscriber to validate against</option>`;
					let count = 0;
					res['Results'].forEach(function(item) {
						let userId = item['Properties'][0]['Property'][0]['Value'][0];
						output += `<option value="${userId}">${userId}</option>`;
						count+=1;
					});
					output += `</select>
								    </div>
								  </div>
								</div>`;


					$('#subscribersList').replaceWith(output);
				}
			}
		})
	}

	$("#validateButton").click(function(){
		$('#links').hide();
		$('#spinna').show();
        let row = $('#subscriberIds').val();
        let emailId = emails[$('#emails').val()];
        let deId = deObjectId[$('#denames').val()];

        $.ajax({
        	type: "POST",
        	url: "/getSubscriberPreview",
        	data: {row: row, emailId: emailId, deId: deId},
        	success: function(res) {
        		$('#spinna').hide();
        		let views = res.body.message.views;
        		views.forEach(function(item) {
        			if (item.contentType.includes('textBody')) {
        				extractLinks(item.content);
        			}
        		});
        	}
        });
    });

    function extractLinks(html) {
    	let output=`<table class="slds-table slds-table_cell-buffer slds-table_bordered slds-table_striped" id="links">
		  <thead>
		    <tr class="slds-line-height_reset">
		      <th class="" scope="col">
		        <div class="slds-truncate" title="Base URL">Base URL</div>
		      </th>
		      <th class="" scope="col">
		        <div class="slds-truncate" title="URL Path">Path</div>
		      </th>
		      <th class="" scope="col">
		        <div class="slds-truncate" title="Matches Base">Matches Base URL</div>
		      </th>
		      <th class="" scope="col">
		        <div class="slds-truncate" title="Validity">Valid URL</div>
		      </th>
		      <th class="" scope="col">
		        <div class="slds-truncate" title="PathValidity">Valid Path</div>
		      </th>
		    </tr>
		    <tbody>`;

    	let regex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;
    	let results;
    	let baseUrl = $('#base-url-input').val();
    	let enteredPaths = $('#path-url-input').val();
    	let count = 0;
    	while ((results = regex.exec(html)) != null) {
    		console.log(results);
    		let fullUrl = results[0];
    		let base = results[1];
    		let subBase = results[3];
    		let path = '';
    		let matches = 'False';
    		let pathMatches ='False';
    		let baseFontColor = "style='color:red'";
    		let pathFontColor = "style='color:red'";
    		
    		if (results[4]) {
    			path = results[4];
    		} else {
    			pathMatches = 'N/A';
    			pathFontColor = "style='color:black'";
    		}
    		if (path != '') {
    			let paths = path.split('/');
	    		paths.forEach(function(item) {
	    			console.log(item);
	    			let listOfPaths = enteredPaths.split(',');
	    			listOfPaths.forEach(function(itemValue) {
	    				if (item == itemValue) {
	    					pathMatches = 'True';
	    					pathFontColor = "style='color:green'";
	    				}
	    			})
	    		});
    		}
    		

    		//grab just the url term
    		let start = subBase.indexOf(".");
    		let urlTerm = subBase;
			let end = subBase.indexOf(".", start+1);
			if (end == -1) {
				urlTerm = urlTerm.substring(0, start);
			} else {
				urlTerm = urlTerm.substring(start+1, end);
			}
    		
    		if (baseUrl.indexOf(",") > 0) {
    			//I've got multiple 
    			let urls = baseUrl.split(",");
    			urls.forEach(function(item) {
    				if (item == urlTerm) {
    					matches = 'True';
    					baseFontColor = "style='color:green'";
    				}
    			}) 
    		}
    		else if (baseUrl == urlTerm) {
    			matches = 'True'
    			baseFontColor = "style='color:green'";
    		}
    		output+=`<tr class="slds-hint-parent">
		      <th data-label="Base URL" scope="row">
		        <div class="slds-truncate" title="Base URL">${base}</div>
		      </th>
		      <td data-label="URL Path">
		        <div class="slds-truncate" title="Sample Path">${path}</div>
		      </td>
		      <td data-label="Matches Base">
		        <div class="slds-truncate" title="Matches Result"><p ${baseFontColor}>${matches}</p></div>
		      </td>
		      <td data-label="Validity">
		        <div class="slds-truncate" title="Valid URL" id="valid-field-${count}"></div>
		      </td>
		      <td data-label="PathValidity">
		        <div class="slds-truncate" title="Valid URL" id="pathvalid-field-${count}"><p ${pathFontColor}>${pathMatches}</p></div>
		      </td>
		    </tr>`
		    
		    $.ajax({
		    	type: "POST",
		    	url: "/checkValidity",
		    	data: {url: fullUrl, count: count},
		    	success: function(res) {
		    		let resolvedLinkColor = "style='color:red'";
		    		if (res.value == 'True') {
		    			resolvedLinkColor = "style='color:green'";
		    		}
		    		$(`#valid-field-${res.count}`).replaceWith(`<div class="slds-truncate" title="Valid URL" id="valid-field-${res.count}"><p ${resolvedLinkColor}>${res.value}</p></div>`);
		    	}
		    })
		    count+=1;
    	}

    	output+=`</tbody></thead>
		</table>`;
		$('#links').show();
		$('#links').replaceWith(output);
    }
});

