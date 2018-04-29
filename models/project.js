function Project(name, root_path, excluded_file_paths=[], git_branch='Git', date_created=Date.now()) {
    this.name = name;
    this.root_path = root_path;
    this.excluded_file_paths = excluded_file_paths;
    this.git_branch = git_branch;
    this.date_created = date_created;
}

module.exports = Project;
