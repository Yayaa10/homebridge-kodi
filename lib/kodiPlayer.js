'use strict'

const kodi = require('./kodi');

let Service,
    Characteristic,
    CustomCharacteristic;

module.exports = {
    PlayerLightbulbAccessory: PlayerLightbulbAccessory,
    PlayerPlaySwitchAccessory: PlayerPlaySwitchAccessory,
    PlayerPauseSwitchAccessory: PlayerPauseSwitchAccessory,
    PlayerStopSwitchAccessory: PlayerStopSwitchAccessory
};

// ======================================
// = PlayerLightbulbAccessory Accessory =
// ======================================

function PlayerLightbulbAccessory(platform, api, lightbulbService, name, version) {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;
    CustomCharacteristic = require('../util/characteristics')(api);

    this.platform = platform;
    this.log = platform.log;
    this.config = platform.config;
    this.name = name;
    this.lightbulbService = lightbulbService;

    this.log("Adding PlayerLightbulbAccessory");

    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "github.com DeutscheMark")
        .setCharacteristic(Characteristic.Model, "Homebridge-Kodi PlayerLightbulb")
        .setCharacteristic(Characteristic.SerialNumber, version)
        .setCharacteristic(Characteristic.FirmwareRevision, version);

    this.lightbulbService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
            kodi.isPlaying(this.config, this.log, (playing, paused) => {
                callback(null, playing);
            });
        })
        .on('set', (on, callback) => {
            kodi.playerGetActivePlayers(this.config, this.log, (error, playerid) => {
                if (!error && playerid != -1) {
                    kodi.playerSetPlay(this.config, this.log, playerid, on, (error, result) => {
                        if (!error && result) {
                            let speed = result.speed ? result.speed : 0;
                            if (speed != 0) {
                                this.log("Setting " + this.name + ": " + on);
                                callback();
                            } else {
                                setTimeout(() => {
                                    this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                                    kodi.isPlaying(this.config, this.log, (playing, paused) => {
                                        this.lightbulbService.getCharacteristic(Characteristic.On).updateValue(playing);
                                    });
                                }, 100);
                                callback();
                            }
                        } else {
                            setTimeout(() => {
                                this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                                kodi.isPlaying(this.config, this.log, (playing, paused) => {
                                    this.lightbulbService.getCharacteristic(Characteristic.On).updateValue(playing);
                                });
                            }, 100);
                            callback();
                        }
                    });
                } else {
                    setTimeout(() => {
                        this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                        kodi.isPlaying(this.config, this.log, (playing, paused) => {
                            this.lightbulbService.getCharacteristic(Characteristic.On).updateValue(playing);
                        });
                    }, 100);
                    callback();
                }
            });
        });
    this.lightbulbService.addCharacteristic(Characteristic.Brightness)
        .on('get', (callback) => {
            kodi.playerGetActivePlayers(this.config, this.log, (error, playerid) => {
                if (!error && playerid != -1) {
                    kodi.playerGetProperties(this.config, this.log, playerid, ["percentage", "totaltime"], (error, result) => {
                        if (!error && result) {
                            let percentage = Math.round(result.percentage ? result.percentage : 0);
                            let timeAndTotaltime = result.totaltime.hours + ":" + result.totaltime.minutes.toString().padStart(2, '0') + ":" + result.totaltime.seconds.toString().padStart(2, '0');
                            if (percentage == 0 && timeAndTotaltime == "0:00:00") {
                                this.log("Getting " + this.name + ": 100 %");
                                callback(null, 100);
                            } else {
                                this.log("Getting " + this.name + ": " + percentage + " %");
                                callback(null, percentage);
                            }
                        } else {
                            callback(null, 0);
                        }
                    });
                } else {
                    callback(null, 0);
                }
            });
        })
        .on('set', (brightness, callback) => {
            kodi.playerGetActivePlayers(this.config, this.log, (error, playerid) => {
                if (!error && playerid != -1) {
                    let percentage = Math.round(brightness);
                    kodi.playerSeek(this.config, this.log, playerid, percentage, (error, result) => {
                        if (!error && result) {
                            let percentage = Math.round(result.percentage ? result.percentage : 0);
                            this.log("Setting " + this.name + ": " + percentage + " %");
                            callback();
                        } else {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            });
        });
    this.lightbulbService.addCharacteristic(CustomCharacteristic.Type);
    this.lightbulbService.addCharacteristic(CustomCharacteristic.ShowTitle);
    this.lightbulbService.addCharacteristic(CustomCharacteristic.SeasonEpisode);
    this.lightbulbService.addCharacteristic(CustomCharacteristic.Label);
    this.lightbulbService.addCharacteristic(CustomCharacteristic.Position);
    this.lightbulbService.addCharacteristic(CustomCharacteristic.Artist);
    this.lightbulbService.addCharacteristic(CustomCharacteristic.Album);
}

PlayerLightbulbAccessory.prototype = {
    identify: function (callback) {
        callback();
    },

    getServices: function () {
        return [this.informationService, this.lightbulbService];
    }
};

// =======================================
// = PlayerPlaySwitchAccessory Accessory =
// =======================================

function PlayerPlaySwitchAccessory(platform, api, switchService, name, version) {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;

    this.platform = platform;
    this.log = platform.log;
    this.config = platform.config;
    this.name = name;
    this.switchService = switchService;

    this.log("Adding PlayerPlaySwitchAccessory");

    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "github.com DeutscheMark")
        .setCharacteristic(Characteristic.Model, "Homebridge-Kodi PlayerPlaySwitch")
        .setCharacteristic(Characteristic.SerialNumber, version)
        .setCharacteristic(Characteristic.FirmwareRevision, version);

    this.switchService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
            kodi.isPlaying(this.config, this.log, (playing, paused) => {
                callback(null, playing);
            });
        })
        .on('set', (on, callback) => {
            kodi.playerGetActivePlayers(this.config, this.log, (error, playerid) => {
                if (!error && playerid != -1) {
                    kodi.playerSetPlay(this.config, this.log, playerid, on, (error, result) => {
                        if (!error && result) {
                            let speed = result.speed ? result.speed : 0;
                            if (speed != 0) {
                                this.log("Setting " + this.name + ": " + on);
                                callback();
                            } else {
                                setTimeout(() => {
                                    this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                                    kodi.isPlaying(this.config, this.log, (playing, paused) => {
                                        this.switchService.getCharacteristic(Characteristic.On).updateValue(playing);
                                    });
                                }, 100);
                                callback();
                            }
                        } else {
                            setTimeout(() => {
                                this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                                kodi.isPlaying(this.config, this.log, (playing, paused) => {
                                    this.switchService.getCharacteristic(Characteristic.On).updateValue(playing);
                                });
                            }, 100);
                            callback();
                        }
                    });
                } else {
                    setTimeout(() => {
                        this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                        kodi.isPlaying(this.config, this.log, (playing, paused) => {
                            this.switchService.getCharacteristic(Characteristic.On).updateValue(playing);
                        });
                    }, 100);
                    callback();
                }
            });
        });
}

PlayerPlaySwitchAccessory.prototype = {
    identify: function (callback) {
        callback();
    },

    getServices: function () {
        return [this.informationService, this.switchService];
    }
};

// ========================================
// = PlayerPauseSwitchAccessory Accessory =
// ========================================

function PlayerPauseSwitchAccessory(platform, api, switchService, name, version) {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;

    this.platform = platform;
    this.log = platform.log;
    this.config = platform.config;
    this.name = name;
    this.switchService = switchService;

    this.log("Adding PlayerPauseSwitchAccessory");

    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "github.com DeutscheMark")
        .setCharacteristic(Characteristic.Model, "Homebridge-Kodi PlayerPauseSwitch")
        .setCharacteristic(Characteristic.SerialNumber, version)
        .setCharacteristic(Characteristic.FirmwareRevision, version);

    this.switchService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
            kodi.isPlaying(this.config, this.log, (playing, paused) => {
                callback(null, paused);
            });
        })
        .on('set', (on, callback) => {
            kodi.playerGetActivePlayers(this.config, this.log, (error, playerid) => {
                if (!error && playerid != -1) {
                    kodi.playerGetItem(this.config, this.log, playerid, [], (error, itemresult) => {
                        if (!error && itemresult && itemresult.item) {
                            kodi.playerSetPlay(this.config, this.log, playerid, !on, (error, result) => {
                                if (!error && result) {
                                    let on = result.speed == 0 ? result.speed == 0 : false;
                                    this.log("Setting " + this.name + ": " + on);
                                    callback();
                                } else {
                                    setTimeout(() => {
                                        this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                                        kodi.isPlaying(this.config, this.log, (playing, paused) => {
                                            this.switchService.getCharacteristic(Characteristic.On).updateValue(paused);
                                        });
                                    }, 100);
                                    callback();
                                }
                            });
                        } else {
                            setTimeout(() => {
                                this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                                kodi.isPlaying(this.config, this.log, (playing, paused) => {
                                    this.switchService.getCharacteristic(Characteristic.On).updateValue(paused);
                                });
                            }, 100);
                            callback();
                        }
                    });
                } else {
                    setTimeout(() => {
                        this.log("Setting " + this.name + ": false - Nothing pausable seems to be playing!");
                        kodi.isPlaying(this.config, this.log, (playing, paused) => {
                            this.switchService.getCharacteristic(Characteristic.On).updateValue(paused);
                        });
                    }, 100);
                    callback();
                }
            });
        });
}

PlayerPauseSwitchAccessory.prototype = {
    identify: function (callback) {
        callback();
    },

    getServices: function () {
        return [this.informationService, this.switchService];
    }
};

// ==============================
// = PlayerStopSwitch Accessory =
// ==============================

function PlayerStopSwitchAccessory(platform, api, switchService, name, version) {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;

    this.platform = platform;
    this.log = platform.log;
    this.config = platform.config;
    this.name = name;
    this.switchService = switchService;

    this.log("Adding PlayerStopSwitchAccessory");

    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "github.com DeutscheMark")
        .setCharacteristic(Characteristic.Model, "Homebridge-Kodi PlayerStopSwitch")
        .setCharacteristic(Characteristic.SerialNumber, version)
        .setCharacteristic(Characteristic.FirmwareRevision, version);

    this.switchService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
            callback(null, false);
        })
        .on('set', (on, callback) => {
            if (on) {
                kodi.playerGetActivePlayers(this.config, this.log, (error, playerid) => {
                    if (!error && playerid != -1) {
                        kodi.playerStop(this.config, this.log, playerid, (error, result) => {
                            if (!error && result) {
                                setTimeout(() => {
                                    this.log("Setting " + this.name + ": false - Stopped!");
                                    this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
                                }, 100);
                                this.log("Setting " + this.name + ": " + on);
                                callback();
                            } else {
                                setTimeout(() => {
                                    this.log("Setting " + this.name + ": false - Stopped!");
                                    this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
                                }, 100);
                                callback();
                            }
                        });
                    } else {
                        setTimeout(() => {
                            this.log("Setting " + this.name + ": false - Stopped!");
                            this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
                        }, 100);
                        callback();
                    }
                });
            } else {
                setTimeout(() => {
                    this.log("Setting " + this.name + ": false - Stopped!");
                    this.switchService.getCharacteristic(Characteristic.On).updateValue(false);
                }, 100);
                callback();
            };
        });
}

PlayerStopSwitchAccessory.prototype = {
    identify: function (callback) {
        callback();
    },

    getServices: function () {
        return [this.informationService, this.switchService];
    }
};