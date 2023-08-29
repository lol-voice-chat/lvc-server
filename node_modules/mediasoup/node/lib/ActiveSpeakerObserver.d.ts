import { EnhancedEventEmitter } from './EnhancedEventEmitter';
import { RtpObserver, RtpObserverEvents, RtpObserverObserverEvents, RtpObserverConstructorOptions } from './RtpObserver';
import { Producer } from './Producer';
import { AppData } from './types';
export type ActiveSpeakerObserverOptions<ActiveSpeakerObserverAppData extends AppData = AppData> = {
    interval?: number;
    /**
     * Custom application data.
     */
    appData?: ActiveSpeakerObserverAppData;
};
export type ActiveSpeakerObserverDominantSpeaker = {
    /**
     * The audio Producer instance.
     */
    producer: Producer;
};
export type ActiveSpeakerObserverEvents = RtpObserverEvents & {
    dominantspeaker: [ActiveSpeakerObserverDominantSpeaker];
};
export type ActiveSpeakerObserverObserverEvents = RtpObserverObserverEvents & {
    dominantspeaker: [ActiveSpeakerObserverDominantSpeaker];
};
type RtpObserverObserverConstructorOptions<ActiveSpeakerObserverAppData> = RtpObserverConstructorOptions<ActiveSpeakerObserverAppData>;
export declare class ActiveSpeakerObserver<ActiveSpeakerObserverAppData extends AppData = AppData> extends RtpObserver<ActiveSpeakerObserverAppData, ActiveSpeakerObserverEvents> {
    /**
     * @private
     */
    constructor(options: RtpObserverObserverConstructorOptions<ActiveSpeakerObserverAppData>);
    /**
     * Observer.
     */
    get observer(): EnhancedEventEmitter<ActiveSpeakerObserverObserverEvents>;
    private handleWorkerNotifications;
}
export {};
//# sourceMappingURL=ActiveSpeakerObserver.d.ts.map