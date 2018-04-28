$('document').ready(function(e) {
    // create new project
    $('form[name="add-roku-form"]').submit((e) => {
        // stop form submission
        e.preventDefault();

        console.log('new roku');
        // validate & scrub
        let ip_address = $('#ip-address');
        let device_name = $('#device-name');
        let username = $('#username');
        let password = $('#password');
        if( !ip_address.val() ) {
            handleInputError(ip_address);
            return;
        } else {
            ip_address = ip_address.val().trim();
        }
        if( !device_name.val() ) {
            handleInputError(device_name);
            return;
        } else {
            device_name = device_name.val().trim();
        }
        if( !username.val() ) {
            handleInputError(username);
            return;
        } else {
            username = username.val().trim();
        }
        if( !password.val() ) {
            handleInputError(password);
            return;
        } else {
            password = password.val();
        }

        let new_roku_data = {
            ip_address: ip_address,
            device_name: device_name,
            username: username,
            password: password
        };

        ipcRenderer.send('new_roku_data', new_roku_data);


    });
});
