function KeyLogList(name, logs, date_created=Date.now()) {
    this.name = name;
    this.logs = logs;
    this.date_created = date_created;
}

KeyLogList.prototype.date_created_pretty = () => {
	return `12/02/2018`;
}

module.exports = KeyLogList;