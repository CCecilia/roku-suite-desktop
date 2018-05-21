const electron = require('electron');
const {ipcRenderer} = electron;
const branch = require('git-branch');
var currentWindow = electron.remote.getCurrentWindow();
let excluded_file_paths = [];
const LOGGER = {
    state: 'stopped',
    queue: []
};

Array.prototype.lastElem = function() {
    return this[this.length - 1];
}

function handleInputError(element) {
    element.css('border', '1px solid red').focus();

    setTimeout(() => {
        element.css('border', '');
    }, 2000);
}

function toggleTrash() {
    // Shows trash 
    if( !$('#trashcan').is(':visible') ){
        $('#roku-select-wrap').hide(350);
        $('#deploy-options').animate({
            width: '50%',
            opcaity: .5,
            min_height: '151px'
        }, 200, function() {
            $('#deploy-options').fadeOut('fast', function() {
                $('#trashcan').fadeIn('fast');
            });
        })
    // hides trash
    } else {
        $('#trashcan').fadeOut('fast', function() {
            $('#deploy-options').fadeIn('fast', function() {
                $('#deploy-options').animate({
                    width: '100%',
                    opcaity: 1,
                    min_height: ''
                }, 200, function() {
                    $('#roku-select-wrap').show();
                });
            });
        })
    }
}

function removeCard(removal_data) {
    if( removal_data.element === 'project' ) {
        $(`.project-card[data-id="${removal_data._id}"]`).hide();
        toggleTrash();
    }  else if( removal_data.element === 'roku' ) {
        $(`.roku-card[data-id="${removal_data._id}"]`).hide();
        toggleTrash();
    } else if( removal_data.element === 'log' ) {
        $(`.key-log-card[data-id="${removal_data._id}"]`).hide();
        toggleTrash();
    }
}

function cardDrag(event, element) {
    console.log('card drag')
    // get db if to element 
    let raw_element = event.srcElement
    let _id = $(raw_element).attr('data-id')

    // attached id and type of element to  element
    event.dataTransfer.setData("removal_data", JSON.stringify({element: element, _id: _id}));

    // toggle trash
    toggleTrash()
}

function allowDrop(event) {
    event.preventDefault();
}

function trash(event) {
    event.preventDefault();

    // get data from dragged card {element type, id}
    let removal_data = JSON.parse(event.dataTransfer.getData("removal_data"));


    // send to main for procssing
    ipcRenderer.send('removal_data', removal_data);

    // remove element
    removeCard(removal_data);
}

function addKeyLogCardToWindow(key_log) {
    // update mainWindow with new project;
    let key_log_html = `
        <div class="col-3 key-log-card clickable" draggable="true" ondragstart="cardDrag(event, 'log')" data-id="${key_log._id}">
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
        <div class="col-3 roku-card clickable" draggable="true" ondragstart="cardDrag(event, 'roku')" data-id="${roku._id}">
            <div class="row">
                <div class="col-12 text-center">
                    <h4 class="roku-font">${roku.device_name}</h4>
                    <p class="text-muted">ip: ${roku.ip_address}</p>
                    <p class="text-muted">un: ${roku.username}</p>
                    <p class="text-muted">pw: ${roku.password}</p>
                </div>
            </div>
        </div>
    `;
    $('#rokus-pane').append(roku_html);
}

function addProjectCardToWindow(project) {
    // update mainWindow with new project;
    let project_html = `
        <div class="col-3 project-card clickable" draggable="true" ondragstart="cardDrag(event, 'project')" ondragend="toggleTrash()" data-id="${project._id}">
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
                    <button class="btn btn-secondary btn-block auto-deploy-btn" data-id="${project._id}">
                        Auto Deploy
                    </button>
                </div>
            </div>
        </div>
    `;
    $('#projects').append(project_html);
}

function getCurrentLogs(keys_only=true) {
    let current_logs = [];
    $('.key-log').each(function () {
        if( keys_only ) {
            if( $(this).attr('data') === 'time-break' ) {
                current_logs.push({time_break: $(this).attr('data-time')});
            } else {
                current_logs.push($(this).attr('data'));
            }

        } else {
            if( $(this).attr('data') === 'time-break' ) {
                current_logs.push({
                    key: {
                        time_break: $(this).attr('data-time')
                    },
                    element: $(this)
                });
            } else {
                current_logs.push({
                    key: $(this).attr('data'),
                    element: $(this)
                });
            }
        }
    });
    return current_logs;
}

function removeKeyLog() {
    console.log('remove key');
    $(this).parent().empty();
}

function sendKeyPressAsync(roku, log) {
    return new Promise((resolve, reject) => {
        // setTimeout(function(error) {
        //     if( error ) {
        //         reject(new Error(`Key pressed error `))
        //     }

        //     log.element.css('background-color', '#c6f4c9');
        //     resolve();
        // }, 3000)
        $.ajax({
            type: 'POST',
            url: `http://${roku.ip_address}:8060/keypress/${log.key}`,
            success: (response) => {
                log.element.css('background-color', '#c6f4c9');
                resolve()
            },
            fail: (response) => {
                log.element.css('background-color', 'red');
                reject(new Error('Key Press failed'));
            }
        });
    });
}

function sendKeyPressSync(roku, key) {
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
}

function handleTimeBreak(event) {
    let data_time = event.srcElement.value;
    let list_element = $(event.srcElement.parentElement.parentElement.parentElement);
    list_element.attr('data-time', Number(data_time));
}

function handleAutoDeploy(project_id) {
    ipcRenderer.send('auto_deploy_data', project_id);
}

function deploy(project_id) {
    console.log('deploying');
    //handle multiple selected rokus
    let roku_ids = []
    let selected = $('#roku-select option:selected');
    for( let i=0; i<selected.length; i++ ) {
        roku_ids.push($(selected[i]).val());
    }

    // setup data
    let deploy_data = {
        project_id: project_id,
        roku_ids: roku_ids
    };

    if( !deploy_data.roku_ids ) {
        let notification = new Notification(
        'Deploy failed', {
            body: 'No Roku selected'
        });

        notification.onclick = () => {
            console.log('Notification clicked')
        }
        return;
    } else {
        console.log(deploy_data)
        ipcRenderer.send('deploy_data', deploy_data);
    }
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

// handle notifiaction
ipcRenderer.on('notificationData', (e, notification_data) => {
    let notification = new Notification(
        notification_data.title, {
            body: notification_data.msg
        })

    notification.onclick = () => {
        console.log('Notification clicked')
    }
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

// auto deploy signaled from project watchers
ipcRenderer.on('auto_deploy_start', (e, project_id) => {
    console.log('auto deploy', project_id);
    deploy(project_id);
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
            $('#projects, #refs-pane, #key-logs-pane, #tools-pane').hide();
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
        deploy($(this).attr('data-id'));
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
        let rokus = $('#roku-select option:selected');



        // send key press call to roku
        for( let i=0; i<rokus.length; i++ ) {
            // -----FOR DEV ONLY-----------START
            if( JSON.parse($(rokus[i]).attr('data')).device_name === 'RemoteTest' ){
                ipcRenderer.send('key_log', key);
                return
            }
            // -----FOR DEV ONLY-----------END
            sendKeyPressSync(JSON.parse($(rokus[i]).attr('data')), key)
        }
    });

    // logger menu toggle
    $('#key-logger-menu-toggle').click((e) => {
        $('#key-logger-menu').slideToggle();
    });

    // handle logging options
    $('.logger-menu-item').click(function(e) {
        let action = $(this).attr('href');
        let logs = getCurrentLogs(false);
        let rokus = $('#roku-select option:selected');
        // let roku = {ip_address: '127.0.0.1'};

        function playLogger() {
            if( LOGGER.state === 'playing' ) {
                if( LOGGER.queue.length ){
                    let log = LOGGER.queue.pop();
                    // check if log is a time break or a key press
                    if( typeof(log.key) === 'object' ){
                        let delay_time = log.key.time_break;
                        setTimeout(function(args) {
                            log.element.css('background-color', '#c6f4c9');
                            continue
                        }, delay_time);
                    } else {
                        for( let i=0; i<rokus.length; i++ ) {
                            let roku = JSON.parse(rokus[i].attr('data'));
                            sendKeyPressAsync(roku, log)
                                .then(() => {
                                    if( LOGGER.state === 'playing' ) {
                                        playLogger()
                                    }
                                })
                                .catch((error) => {
                                    LOGGER.state === 'paused';
                                    // notify error
                                    $.notify({
                                        message: error.message
                                    },{
                                        type: 'danger'
                                    });
                                });
                        }
                    }
                } else {
                    LOGGER.state = 'stopped';
                }
            }
        }

        // clear logger list of all
        if( action === '#clear' ) {
            $('#key-log-list').empty();
        } else if ( action === '#time-break' ) {
            let time_break = `
            <li class="ui-state-default key-log" data="time-break">
                <div class="row clickable">
                    <div class="col-2"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span></div>
                    <div class="col-8 text-center">
                        <input type="number" name="time_break" onkeyup="handleTimeBreak(event)"/>
                        <span>ms</span>
                    </div>
                    <div class="col-2"><i class="fa fa-close remove-key-log clickable" onclick="removeKeyLog()"></i></div>
                </div>
            </li>`;

            $('#key-log-list').append(time_break);
        } else if ( action === '#play' ) {
            // revese logs in queue for reversed iteration
            // to maintain indexs while popping
            if( !LOGGER.queue.length ) {
                LOGGER.queue = logs.reverse();
            }
            LOGGER.state = 'playing';
        } else if ( action === '#pause' ) {
            LOGGER.state = 'paused'
        } else if ( action === '#stop' ) {
            // on stop empty queue
            LOGGER.state = 'stopped';
            LOGGER.queue = [];
        }

        playLogger();
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

            // validate/scrub
            let log_list_name = $('#log-name');
            if( !log_list_name.val() ) {
                handleInputError(log_list_name);
                return;
            }

            let key_log_data =  {
                name: log_list_name.val().trim(),
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

        /* TODO:
            figure out how to detect when loggerWindow is done loading
            as well as possibly populating window directly from here
        */
        // wait for new wondow to load into dom
        setTimeout(() => {
            // populate with key logs
            for( let i=0; i<log_data.logs.length; i++ ) {
                ipcRenderer.send('key_log', log_data.logs[i]);
            }
        }, 500);
    });

    // handle auto deploy btn
    $('.auto-deploy-btn').click(function(e) {
        // handle btn animation
        $('.auto-deploy-btn').removeClass('active btn-success');
        $('.auto-deploy-btn').addClass('btn-secondary');
        $(this).toggleClass('btn-success btn-secondary');
        $(this).addClass('active');

        // handle auto deploy
        let project_id = $(this).attr('data-id');
        handleAutoDeploy(project_id);
    });
});
