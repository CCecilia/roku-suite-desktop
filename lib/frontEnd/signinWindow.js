$('document').ready(function(e) {
    $('#register-btn').click(function(e) {
        if( $('#register-hidden').is(':visible') ){
            let email = $('#email');
            let password = $('#password');
            let confirm_password = $('#confirm-password');

            // validate/scrub
            if( !email.val() ) {
                handleInputError(email);
                return;
            } else {
                email = email.val().trim();
            }
            if( !password.val() || password.val() !== confirm_password.val() ) {
                handleInputError(email);
                return;
            } else {
                password = password.val();
            }

            let new_user_data = {
                email: email,
                password: password
            };

            ipcRenderer.send('new_user_data', new_user_data);
        } else {
            $('#register-hidden').toggle();
        }

    });
});
