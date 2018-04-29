var currentWindow = electron.remote.getCurrentWindow();

// handle new project
ipcRenderer.on('new_project', (e, new_project) => {
    addProjectCardToWindow(new_project);
});

// load existing projects
for( let i=0; i<currentWindow.init_data.projects.length; i++) {
    addProjectCardToWindow(currentWindow.init_data.projects[i]);
}

// load existing rokus
for( let i=0; i<currentWindow.init_data.rokus.length; i++) {
    let roku = currentWindow.init_data.rokus[i];
    let html = `<option value="${roku._id}">${roku.device_name}</option>`;
    $('#roku-select').append(html);
}

$('document').ready(function(e) {
    // handle side bar clicks
    $('.sidebar-nav').click(function(e) {
        let nav_target = $(this).attr('data-target');
        console.log(nav_target);
    });

    $('.deploy-btn').click(function(e) {
        let deploy_data = {
            project_id: $(this).attr('data-id'),
            roku_id: $('#roku-select option:selected').val()
        };

        if( !deploy_data.roku_id ) {
            return;
        } else {
            ipcRenderer.send('deploy_data', deploy_data);
        }
    });
});
