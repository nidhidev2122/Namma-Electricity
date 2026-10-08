// mobile/src/components.js
import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { C, shadow } from './theme';
import { RISK_LABEL, SUBDIVISIONS } from './data';
import { useApp } from './AppContext';

export function Card({ title, children }) {
  return <View style={[s.card, shadow]}>{title ? <Text style={s.cardTitle}>{title}</Text> : null}{children}</View>;
}
export function Button({ title, onPress, secondary=false, danger=false, disabled=false }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({pressed}) => [
    s.btn, secondary && s.btnSecondary, danger && s.btnDanger, disabled && s.disabled, pressed && s.pressed
  ]}><Text style={[s.btnText, secondary && s.btnSecondaryText]}>{title}</Text></Pressable>;
}
export function Chip({ title, selected, onPress }) {
  return <Pressable onPress={onPress} style={[s.chip, selected && s.chipOn]}><Text style={[s.chipText, selected && s.chipTextOn]}>{title}</Text></Pressable>;
}
export function Field({ label, value, onChangeText, keyboardType='default', placeholder }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput value={String(value ?? '')} onChangeText={onChangeText}
    keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#98A2B3" style={s.input}/></View>;
}
export function RiskBadge({ level }) {
  return <View style={[s.badge, {backgroundColor: level === 'high' ? C.red : level === 'medium' ? C.amber : C.green}]}>
    <Text style={s.badgeText}>{RISK_LABEL[level]}</Text>
  </View>;
}
export function AreaPicker() {
  const { areaId, setAreaId } = useApp();
  const a = SUBDIVISIONS.find(x => x.id === areaId) || SUBDIVISIONS[0];
  return <View style={s.field}><Text style={s.label}>Your sub-division</Text>
    <View style={s.selectBox}><Text style={s.selectText}>{a.division_name} ({a.subdivision_code})</Text>
      <Picker selectedValue={areaId} onValueChange={setAreaId} style={s.picker}>
        {SUBDIVISIONS.map(x => <Picker.Item key={x.id} label={`${x.division_name} (${x.subdivision_code})`} value={x.id} />)}
      </Picker>
    </View>
  </View>;
}
export function useArea() {
  const { areaId } = useApp();
  return SUBDIVISIONS.find(s => s.id === areaId) || SUBDIVISIONS[0];
}
export function Stat({label,value,sub}) {
  return <View style={{flex:1,minWidth:90,padding:10,borderRadius:12,backgroundColor:'#F8FAFC',borderWidth:1,borderColor:C.line}}><Text style={{fontSize:20,fontWeight:'800',color:C.ink}}>{value}</Text><Text style={s.muted}>{label}</Text>{sub?<Text style={s.muted}>{sub}</Text>:null}</View>;
}
export function Disclaimer() {
  return <View style={s.disclaimer}>
    <Text style={s.disclaimerText}>Independent app; not affiliated with BESCOM/KERC. Outage figures and tariff rates are illustrative. Verify official notices before acting.</Text>
    <Text style={s.disclaimerText}>Privacy: this app does not ask for Aadhaar, voter ID, phone number or name. Local data is stored on this device.</Text>
  </View>;
}
export const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:C.bg}, content:{padding:16,paddingBottom:32},
  header:{paddingHorizontal:16,paddingTop:14,paddingBottom:8}, title:{fontSize:27,fontWeight:'800',color:C.ink},
  subtitle:{fontSize:13,color:C.muted,marginTop:3}, card:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:16,padding:16,marginBottom:12},
  cardTitle:{fontSize:17,fontWeight:'750',color:C.ink,marginBottom:9}, text:{fontSize:14,color:C.ink,lineHeight:21,marginVertical:5},
  muted:{fontSize:13,color:C.muted,lineHeight:19}, label:{fontSize:13,fontWeight:'600',color:C.ink,marginBottom:5},
  field:{marginBottom:10}, input:{borderWidth:1,borderColor:C.line,borderRadius:10,backgroundColor:C.white,paddingHorizontal:12,paddingVertical:10,fontSize:15,color:C.ink},
  selectBox:{borderWidth:1,borderColor:C.line,borderRadius:10,backgroundColor:C.white,overflow:'hidden'},selectText:{fontSize:14,fontWeight:'600',color:C.ink,paddingHorizontal:10,paddingTop:10},picker:{height:48,width:'100%'},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:9}, chip:{borderWidth:1,borderColor:C.line,borderRadius:99,paddingHorizontal:10,paddingVertical:7,backgroundColor:C.white},
  chipOn:{backgroundColor:C.blueSoft,borderColor:C.brand},chipText:{fontSize:12,color:C.ink},chipTextOn:{color:C.brand,fontWeight:'700'},
  btn:{backgroundColor:C.brand,paddingHorizontal:14,paddingVertical:11,borderRadius:10,alignItems:'center',marginVertical:5},btnSecondary:{backgroundColor:'#EEF2F6'},btnDanger:{backgroundColor:C.red},
  btnText:{color:C.white,fontSize:14,fontWeight:'700'},btnSecondaryText:{color:C.ink},disabled:{opacity:.45},pressed:{opacity:.78},
  badge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:5,borderRadius:99},badgeText:{color:C.white,fontSize:12,fontWeight:'700'},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,borderTopWidth:1,borderTopColor:C.line,paddingVertical:11},
  rowActions:{flexDirection:'row',alignItems:'center',gap:7}, smallInput:{width:68,borderWidth:1,borderColor:C.line,borderRadius:8,padding:7,textAlign:'center'},
  link:{color:C.brand,fontWeight:'650',fontSize:14,paddingVertical:5},tableRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:7,borderBottomWidth:1,borderBottomColor:C.line},
  total:{fontWeight:'800'}, good:{color:'#047857',fontWeight:'650'}, warn:{color:'#B45309',fontWeight:'650'}, alert:{borderLeftWidth:3,borderLeftColor:C.amber,backgroundColor:'#FFFBEB',padding:10,borderRadius:8,marginVertical:5},
  progress:{height:9,borderRadius:6,backgroundColor:C.line,overflow:'hidden',marginVertical:8}, progressFill:{height:'100%',backgroundColor:C.green},
  disclaimer:{paddingHorizontal:16,paddingBottom:22},disclaimerText:{fontSize:11,color:C.muted,lineHeight:16,marginTop:5}
  ,settingRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:8}
  ,moreMenu:{marginHorizontal:16,marginBottom:8,borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.white,overflow:'hidden'}
  ,moreItem:{paddingHorizontal:14,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line}
  ,chart:{height:135,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-around',paddingHorizontal:12,paddingTop:12}
  ,chartColumn:{alignItems:'center',justifyContent:'flex-end',gap:6}
  ,chartBar:{width:34,borderRadius:8,minHeight:8}
  ,quickActions:{gap:7}
  ,mapButton:{width:38,height:38,alignItems:'center',justifyContent:'center',borderBottomWidth:1,borderBottomColor:C.line}
  ,mapButtonText:{fontSize:24,color:C.ink}
  ,analyticsTrack:{height:9,borderRadius:6,backgroundColor:C.line,overflow:'hidden',marginTop:4}
  ,analyticsBar:{height:'100%',borderRadius:6}
});