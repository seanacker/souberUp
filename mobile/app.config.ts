import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
    name: 'soberup',
    slug: 'soberup',
    extra: { apiUrl: 'http://127.0.0.1:8000/api/v1/graphql' },
    android: {
        package: 'com.soberup.mobile',
        permissions: ['PACKAGE_USAGE_STATS'],
        newArchEnabled: false
    },
    plugins: [
        "expo-secure-store"
    ]
}

export default config;