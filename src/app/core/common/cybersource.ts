export class CyberSourceSetting {
    static config(value: any) {

        let data = null;

        if (value === 'test') {
            data = {
                endpotint: 'https://testsecureacceptance.cybersource.com/silent/pay',
                deviceFingerPrint: '1snn5n9w'
            };
        } else if (value === 'prod') {
            return {
                endpotint: 'https://secureacceptance.cybersource.com/silent/pay',
                deviceFingerPrint: 'k8vif92e'
            }
        }

        return data;
    }
}