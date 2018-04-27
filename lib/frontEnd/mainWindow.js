// handle new project
ipcRenderer.on('new_project', (e, new_project) => {
    addProjectCardToWindow(new_project);
});

$('document').ready(function(e) {
    // handle side bar clicks
    $('.sidebar-nav').click(function(e) {
        let nav_target = $(this).attr('data-target');
        console.log(nav_target);
    });
});
