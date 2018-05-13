const {Application} = require('spectron');
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

if( process.platform === 'win32' ) {
	electronPath += '.cmd'
}

var appPath = path.join(__dirname, '..');


var app = new Application({
	path: electronPath,
	args: [appPath]
});

global.before(() => {
	chai.should();
	chai.use(chaiAsPromised);
});

describe('Test Main Window', function() {
	beforeEach(function() {
		return app.start();
	});

	afterEach(function() {
		return app.stop();
	});

	it('opens main window', () => {
		return app.client.waitUntilWindowLoaded()
			.getWindowCount.should.eventually.equal(1);
	});

	it('test main window\'s title', () => {
		return app.client.waitUntilWindowLoaded()
			.getTitle().should.eventually.equal('Roku Suite');
	});
});

