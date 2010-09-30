/*
 * Ajax link validator for VZ Url fieldtype
 * by Eli Van Zoeren - http://elivz.com
 */

// jQuery plugin to check the url and display the result
var vzUrl = {
  'init' : function() {
    jQuery('.vz_url_field').each(function() {
      // Cache the field
      var $field = jQuery(this);
      
      // Make sure it isn't already set up
      if ($field.next('.vz_url_msg').length > 0) return;
      
      $field
        .wrap('<div class="vz_url_wrapper" />')
        .after('<label class="vz_url_msg" for="' + $field.attr('id') + '"></label>');
      $field.next('.vz_url_msg')
        .hide()
        .click(function() {
          jQuery(this).fadeOut(500);
        });
      
      // Seup event handlers
      $field.keyup(function(){ vzUrl.check_field(this,true) })
      
      // Check it
      vzUrl.check_field($field);
    });
  },
  
  'check_field' : function(field,delay) {
    // Clear the timeout
    if (vzUrl.$timer && delay) clearTimeout(vzUrl.$timer);
    
    // Cache the field
    var $field = jQuery(field)
  	  .removeClass('empty invalid valid')
  	  .addClass('checking');
  	  
    // Hide the message box
    $field.next('.vz_url_msg').fadeOut(200);
    
    // Don't bother checking the default value of http://
  	if ($field.val() == 'http://' || $field.val() == '') {
  		$field
  		  .removeClass('valid invalid checking')
  		  .addClass('empty')
  		  .next('.vz_url_msg').fadeOut(200);
  		return;
  	} else {
  		$field.removeClass('empty');
  	}

    if (delay) {
      // Use a timeout to prevent an ajax call on every keystroke
      vzUrl.$timer = setTimeout(function(){ vzUrl.ajax_call($field) }, 350);
    } else {
      vzUrl.ajax_call($field)
    }
  },
  
  'ajax_call' : function($field) {
    // Make sure it's even a valid url
    if (!$field.val().match(/^(https?|ftp):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?$/gi)) {
		  $field
  		  .removeClass('empty valid checking')
  		  .addClass('invalid')
			  .next('.vz_url_msg')
		    	.html(vzUrl.errorText)
		    	.fadeIn(800);
		    return false;
		}
		
		// Ajax call to proxy.php to check the url
		jQuery.getJSON( 
			vzUrl.proxyUrl + '?callback=?', 
			{ path: $field.val() }, 
			function (data) {
		    // Make sure the url we are checking is still there
		    if (data.original != $field.val()) return;
		    
				// Show or hide the error message, as needed
				if ((data.original == data.final) && (data.http_code >= 200) && (data.http_code < 400)) {
				  // The url is valid
					$field
      		  .removeClass('empty invalid checking')
      		  .addClass('valid')
					  .next('.vz_url_msg').fadeOut(200);
				} else if (data.original != data.final) {
				  // The url is a redirect
				  var msg = vzUrl.redirectText
				  	.replace(/{{old_url}}/g, data.original)
				  	.replace(/{{new_url}}/g,data.final)
				  	.replace(/{{update="(.+?)"}}/g, '<a href="#" class="update_url">$1</a>');
					$field
      		  .removeClass('empty invalid checking')
      		  .addClass('valid')
					  .next('.vz_url_msg')
			        .html(msg)
			        .fadeIn(800)
			          .children('.update_url').click(function() { 
			            $field
			              .val(data.final)
			              .next('.vz_url_msg').fadeOut(200);
			            vzUrl.ajax_call($field);
			            return false;
			          });
				} else {
				  // Invalid
					$field
      		  .removeClass('empty valid checking')
      		  .addClass('invalid')
					  .next('.vz_url_msg')
			        .html(vzUrl.errorText)
			        .fadeIn(800);
				}
			}
		);
  }
};

jQuery(document).ready(function() {
  vzUrl.init();
  
  // Re-initialize every time a row is added
  if (jQuery.isFunction(jQuery.fn.ffMatrix)) {
  	jQuery.fn.ffMatrix.onDisplayCell.ff_vz_url = function(td) {
      vzUrl.init();
  	};
  }
})