function Roku(ip_address, device_name, username, password, date_created=Date.now()) {
    this.ip_address = ip_address;
    this.device_name = device_name;
    this.username = username;
    this.password = password;
    this.date_created = date_created;
}

module.exports = Roku;
