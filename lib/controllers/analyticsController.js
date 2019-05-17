class AnalyticsController {

    constructor() {
        this.onUpdate = this._onUpdate.bind(this);
    }

    init(mainWindow, ingestor) {
      this.mainWindow = mainWindow;
      this.ingestor = ingestor;
    }

    listen() {
        console.log('this._onUpdate ' + this.onUpdate);
        this.ingestor.emitter.on('update', this.onUpdate);
    }

    ignore() {
        this.ingestor.emitter.removeListener('update', this.onUpdate);
    }

    /**
     * handle emitted event
     * @param {String} payload JSON response 
     */
    _onUpdate(payload) {
        const payloadObj = JSON.parse(payload);
        this.mainWindow.webContents.send('updateAnalytics', payloadObj);
    }
}

module.exports = () => { return new AnalyticsController() };
