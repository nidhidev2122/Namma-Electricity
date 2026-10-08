import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { C, s } from '../theme';
export default function Loading({label='Loading…'}) { return <View style={{padding:32,alignItems:'center'}}><ActivityIndicator color={C.brand}/><Text style={[s.muted,{marginTop:10}]}>{label}</Text></View>; }
