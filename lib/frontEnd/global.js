const electron = require('electron');
const {ipcRenderer} = electron;
const branch = require('git-branch');
var currentWindow = electron.remote.getCurrentWindow();
let excluded_file_paths = [];

Array.prototype.lastElem = function() {
    return this[this.length - 1];
}

function handleInputError(element) {
    element.css('border', '1px solid red').focus();

    setTimeout(() => {
        element.css('border', '');
    }, 2000);
}

function addProjectCardToWindow(project) {
    // update mainWindow with new project;
    let project_html = `
        <div class="col-3 project-card clickable" data-id="${project._id}">
            <div class="row">
                <div class="col-12 text-center">
                    <h4 class="roku-font">${project.name}</h4>
                    <p class="text-muted">${project.git_branch}</p>
                </div>
                <div class="col-12 text-center pad-4">
                    <button class="btn btn-roku btn-block deploy-btn" data-id="${project._id}">
                        Deploy
                        <i class="fa fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    $('#projects').append(project_html);
}

function addKeyLogCardToWindow(key_log) {
    // update mainWindow with new project;
    let key_log_html = `
        <div class="col-3 key-log-card clickable" data-id="${key_log._id}">
            <div class="row">
                <div class="col-12 text-center">
                    <h4 class="roku-font">${key_log.name}</h4>
                    <p class="text-muted">${key_log.date_created}</p>
                </div>
                <div class="col-12 text-center pad-4">
                    <button class="btn btn-roku btn-block open-key-log" data='${JSON.stringify(key_log)}'>
                        Open
                    </button>
                </div>
            </div>
        </div>
    `;
    $('#key-logs-pane').append(key_log_html);
}

function addRokuCardToWindow(roku) {
    // update mainWindow with roku;
    let roku_html = `
        <div class="col-3 roku-card clickable" data-id="${roku._id}">
            <div class="row">
                <div class="col-12 text-center">
                    <h4 class="roku-font">${roku.device_name}</h4>
                    <p class="text-muted">ip: ${roku.ip_address}</p>
                    <p class="text-muted">un: ${roku.username}</p>
                    <p class="text-muted">pw: ${roku.password}</p>
                </div>
                <div class="col-12 text-center pad-4">
                    <button class="btn btn-roku btn-block remove-roku" data-id='${roku._id}'>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `;
    $('#rokus-pane').append(roku_html);
}

function getCurrentLogs(keys_only=true) {
    let current_logs = [];
    $('.key-log').each(function () {
        if( keys_only ) {
            current_logs.push($(this).attr('data'));
        } else {
            current_logs.push({
                key: $(this).attr('data'),
                element: $(this)
            });
        }
    });
    return current_logs;
}

function removeKeyLog() {
    console.log('remove key');
    console.log($(this).parent().empty());
}

function sendKeyPressAsync(roku, log) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: `http://${roku.ip_address}:8060/keypress/${log.key}`,
            success: (response) => {
                log.element.css('background-color', 'green');
                resolve()
            },
            fail: (response) => {
                log.element.css('background-color', 'red');
                reject(new Error(`Key pressed error `))
            }
        });
    });
}

// handle main window initial page data
if( currentWindow.init_data ) {
   //existing projects
    for( let i=0; i<currentWindow.init_data.projects.length; i++) {
        addProjectCardToWindow(currentWindow.init_data.projects[i]);
    }

    // existing rokus
    for( let i=0; i<currentWindow.init_data.rokus.length; i++) {
        let roku = currentWindow.init_data.rokus[i];
        let roku_data = JSON.stringify(roku);
        let html = `<option value='${roku._id}' data='${roku_data}'>${roku.device_name}</option>`;
        $('#roku-select').append(html);
        addRokuCardToWindow(roku);
    }

    // key logs
    for( let i=0; i<currentWindow.init_data.key_logs.length; i++) {
        addKeyLogCardToWindow(currentWindow.init_data.key_logs[i]);
    }
}

// handle new project
ipcRenderer.on('new_project', (e, new_project) => {
    addProjectCardToWindow(new_project);
});

// handle new project
ipcRenderer.on('new_roku', (e, new_roku) => {
    let html = `<option value="${new_roku._id}">${new_roku.device_name}</option>`;
    $('#roku-select').append(html);
    addRokuCardToWindow(roku);
});

// handle error
ipcRenderer.on('error', (e, error) => {
    // notify error
    $.notify({
        message: error.message
    },{
        type: 'danger'
    });
});

// handle project details
ipcRenderer.on('project_data', (e, project_data) => {
    $('#project_path').val(project_data.root_path);
});

// update key log
ipcRenderer.on('key_log', (e, key) => {
    let log_html = `
    <li class="ui-state-default key-log" data="${key}">
        <div class="row clickable">
            <div class="col-2"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span></div>
            <div class="col-8 text-center">${key}</div>
            <div class="col-2"><i class="fa fa-close remove-key-log clickable" onclick="removeKeyLog()"></i></div>
        </div>
    </li>`;

    $('#key-log-list').append(log_html);
});

$('document').ready(function(e) {
    // handle side bar clicks
    $('.sidebar-nav').click(function(e) {
        let nav_target = $(this).attr('data-target');
        $('.sidebar-nav').removeClass('active-nav');
        $(this).addClass('active-nav');

        if(  nav_target === 'projects' ) {
            $('#tools-pane, #refs-pane, #key-logs-pane, #rokus-pane').hide();
            $('#projects').show();
        } else if ( nav_target === 'rokus' ) { 
            $('#projects, #refs-pane, #key-logs-pane').hide();
            $('#rokus-pane').show();
        }else if( nav_target === 'tools' ) {
            $('#projects, #refs-pane, #key-logs-pane, #rokus-pane').hide();
            $('#tools-pane').show();
        } else if ( nav_target === 'refs' ) {
            $('#projects, #tools-pane,  #key-logs-pane, #rokus-pane').hide();
            $('#refs-pane').show();
        } else if ( nav_target === 'key_logs' ) {
            $('#projects, #tools-pane,  #refs-pane, #rokus-pane').hide();
            $('#key-logs-pane').show();
        }
    });

    // deploy to roku
    $('.deploy-btn').click(function(e) {
        let deploy_data = {
            project_id: $(this).attr('data-id'),
            roku_id: $('#roku-select option:selected').val()
        };

        if( !deploy_data.roku_id ) {
            $.notify({
                message: 'No Roku selected'
            },{
                type: 'danger'
            });
            return;
        } else {
            ipcRenderer.send('deploy_data', deploy_data);
        }
    });

    // open project details
    $('#projects .project-card').on('click', function(e) {
        let project_id = $(this).attr('data-id');
        console.log(project_id);
    });

    // handle choose directory dropdown
    $('#add-project').change( function(e) {

        // fill form inputs
        let project_path = $(this)[0].files[0].path;
        let project_name = project_path.split('/').lastElem();

        $('#project_path').val(project_path);

        if( !$('#project_name').val() ) {
            $('#project_name').val(project_name);
        }
    });

    // handle excluded files
    $('#exclude-files').change(function(e) {
        excluded_file_paths = [];
        $('#excluded_file_paths').empty();

        let excluded_files = $(this)[0].files;

        for( let i=0; i<excluded_files.length; i++ ) {
            excluded_file_paths.push(excluded_files[i].path);
            let html = `<li class="excluded-file clickable" data-toggle="tooltip" onmouseover="$(this).tooltip('show')" title="${excluded_files[i].path}">${excluded_files[i].name}</li>`;
            $('#excluded_file_paths').append(html);
        }
    });

    // create new project
    $('form[name="add-project-form"]').submit((e) => {
        // stop form submission
        e.preventDefault();

        // validate
        let name = $('#project_name');
        let path = $('#project_path');
        if (!name.val() ) {
            handleInputError(name);
            return;
        } else {
            // scrub
            name = name.val().trim()
        }
        if (!path.val() ) {
            handleInputError(path);
            return
        } else {
            // scrub
            path = path.val().trim();
        }

        // create new project
        let new_project_data = {
            name: name,
            root_path: path,
            excluded_file_paths: excluded_file_paths
        };

        branch(new_project_data.root_path)
        .then((name) => {
            new_project_data.git_branch = name;
            ipcRenderer.send('new_project', new_project_data);
        })
        .catch((error) => {
            ipcRenderer.send('new_project', new_project_data);
        });
    });

    // create new project
    $('form[name="add-roku-form"]').submit((e) => {
        // stop form submission
        e.preventDefault();

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

    // toggle key logging on/off
    $('input[name="key_logging').change(function(e){
        if( $(this).is(':checked') ) {
            $('.key-logger-status').css('color', 'green');
            ipcRenderer.send('key_logger', {open: true, log_data: null});
        } else {
            $('.key-logger-status').css('color', 'red');
            ipcRenderer.send('key_logger', {open: false, log_data: null});
        }
    });

    // handle remote btn  presses
    $('.remote-btn').click(function(e) {
        let key = $(this).attr('data-id');
        let roku = JSON.parse($('#roku-select option:selected').attr('data'));

        // -----FOR DEV ONLY-----------START
        if( roku.device_name === 'RemoteTest' ){
            ipcRenderer.send('key_log', key);
            return
        }
        // -----FOR DEV ONLY-----------END

        // send key press call top roku
        $.ajax({
            type: "POST",
            url: `http://${roku.ip_address}:8060/keypress/${key}`,
            success: () => {
                // log key if logge enabled
                if( $('input[name="key_logging').is(':checked') ) {
                    ipcRenderer.send('key_log', key);
                }
            },
            fail: () => {
                // notify error
                $.notify({
                    message: 'Key Press failed to send'
                },{
                    type: 'danger'
                });
            }
        });
    });

    // logger menu toggle
    $('#key-logger-menu-toggle').click((e) => {
        $('#key-logger-menu').slideToggle();
    });

    // handle logging options
    $('.logger-menu-item').click(function(e) {
        let action = $(this).attr('href');
        let logs = getCurrentLogs(false);
        let queue = [];
        let state = 'stopped';
        // let roku = JSON.parse($('#roku-select option:selected').attr('data'));
        let roku = {ip_address: '127.0.0.1'};

        if( action === '#clear' ) {
            $('#key-log-list').empty();
        } else if ( action === '#play' ) {
            // revese logs in queue for reveresed iteration so use of pop
            if( !queue.length ) {
                queue = logs.reverse();
            }
            state = 'playing';
        } else if ( action === '#pause' ) {
            state = 'paused'
        } else if ( action === '#stop' ) {
            state = 'stopped';
            queue = [];
        }
            // for( let i = queue.length - 1; i >= 0; i-- ) {
            //     log = queue.pop();

            //     sendKeyPressAsync(roku, log)
            //         .then(() => {

            //         })
            //         .catch(() => {

            //         });
            // }
            while( state === 'playing' ) {
                let i = queue.length - 1;

                if( i >= 0 ) {
                    let log = queue.pop();

                    sendKeyPressAsync(roku, log)
                        .then(() => {
                            i--;
                        })
                        .catch((err) => {
                            console.error(err);
                            i--;
                        });
                }
            }
    });

    // logger sortable
    $('#key-log-list').sortable();

    // logger sortable
    $('#key-log-list').disableSelection();

    // save key log
    $('form[name="save-log-form"]').submit((e) => {
        console.log('saving logs');
        // stop form submission
        e.preventDefault();

        // check for logs
        if( $('#key-log-list').children().length > 0 ) {

            let log_list_name = $('#log-name');
            if( !log_list_name.val() ) {
                handleInputError(log_list_name);
                return;
            }

            let key_log_data =  {
                name: log_list_name.val(),
                logs: getCurrentLogs()
            }

            // save key logs
            ipcRenderer.send('key_log_data', key_log_data);

            //  close modal
            $('#saveLogsModal').modal('hide');
        }
    });

    //handle key log open
    $('.open-key-log').click(function(e) {
        console.log('clicked');
        // let log_data = JSON.parse($(this).attr('data'));
        let log_data = JSON.parse($(this).attr('data'));
        ipcRenderer.send('key_logger', {open: true});

        // wait for new wondow to load into dom
        setTimeout(() => {
            // populate with key logs
            for( let i=0; i<log_data.logs.length; i++ ) {
                ipcRenderer.send('key_log', log_data.logs[i]);
            }
        }, 500);
    });
});
