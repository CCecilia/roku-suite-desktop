Array.prototype.lastElem = function() {
    return this[this.length - 1];
}

// function Project(name, file_path, excluded_files)

$('document').ready(function(e) {
    $('#add-project').on('change', function(e) {
        // set form inputs
        let project_path = $(this)[0].files[0].path;
        let project_name = project_path.split('/').lastElem();
        $('input[name="project_path"]').val(project_path);
        $('input[name="project_name"]').val(project_name);

        // toggle form
        $('#project-path-selection, form[name="add-project-form"]').toggle();
    });

    $('form[name="add-project-form"]').submit((e) => {
        e.preventDefault();

        project.name = $('input[name="project_name"]').val();
        project.path = $('input[name="project_path"]').val();
        let excluded_files = $(this)[0].files;

        for( let i=0; i<excluded_files.length; i++ ) {
            project.excluded
        }
    });
});
