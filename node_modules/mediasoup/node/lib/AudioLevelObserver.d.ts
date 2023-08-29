import { EnhancedEventEmitter } from './EnhancedEventEmitter';
import { RtpObserver, RtpObserverEvents, RtpObserverObserverEvents, RtpObserverConstructorOptions } from './RtpObserver';
import { Producer } from './Producer';
import { AppData } from './types';
export type AudioLevelObserverOptions<AudioLevelObserverAppData extends AppData = AppData> = {
    /**
     * Maximum number of entries in the 'volumes”' event. Default 1.
     */
    maxEntries?: number;
    /**
     * Minimum average volume (in dBvo from -127 to 0) for entries in the
     * 'volumes' event.	Default -80.
     */
    threshold?: number;
    /**
     * Interval in ms for checking audio volumes. Default 1000.
     */
    interval?: number;
    /**
     * Custom application data.
     */
    appData?: AudioLevelObserverAppData;
};
export type AudioLevelObserverVolume = {
    /**
     * The audio Producer instance.
     */
    producer: Producer;
    /**
     * The average volume (in dBvo from -127 to 0) of the audio Producer in the
     * last interval.
     */
    volume: number;
};
export type AudioLevelObserverEvents = RtpObserverEvents & {
    volumes: [AudioLevelObserverVolume[]];
    silence: [];
};
export type AudioLevelObserverObserverEvents = RtpObserverObserverEvents & {
    volumes: [AudioLevelObserverVolume[]];
    silence: [];
};
type AudioLevelObserverConstructorOptions<AudioLevelObserverAppData> = RtpObserverConstructorOptions<AudioLevelObserverAppData>;
export declare class AudioLevelObserver<AudioLevelObserverAppData extends AppData = AppData> extends RtpObserver<AudioLevelObserverAppData, AudioLevelObserverEvents> {
    /**
     * @private
     */
    constructor(options: AudioLevelObserverConstructorOptions<AudioLevelObserverAppData>);
    /**
     * Observer.
     */
    get observer(): EnhancedEventEmitter<AudioLevelObserverObserverEvents>;
    private handleWorkerNotifications;
}
export {};
//# sourceMappingURL=AudioLevelObserver.d.ts.map