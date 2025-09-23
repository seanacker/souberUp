import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
    name: 'soberup',
    slug: 'soberup',
    extra: { apiUrl: 'https://twelve-feet-divide.loca.lt/api/v1/graphql' },
    android: {
        package: 'com.soberup.mobile',
        permissions: ['PACKAGE_USAGE_STATS'],
        newArchEnabled: false
    }
}

export default config;