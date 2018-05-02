function KeyLogList(name, logs, date_created=Date.now()) {
    this.name = name;
    this.logs = logs;
    this.date_created = date_created;
}

module.exports = KeyLogList;