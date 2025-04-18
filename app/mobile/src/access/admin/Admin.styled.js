import { StyleSheet } from 'react-native';
import { Colors } from 'constants/Colors';

export let styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
  },
  config: {
    paddingTop: 8,
  },
  icon: {
    padding: 8,
  },
  space: {
    width: 32,
  },
  mfaOverlay: {
    width: '100%',
    height: '100%',
  },
  mfaError: {
    width: '100%',
    height: 24,
    display: 'flex',
    alignItems: 'center',
  },
  mfaErrorLabel: {
    color: Colors.dangerText,
  },
  mfaControl: {
    height: 32,
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 16,
  },
  mfaCancel: {
    width: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cancelButton,
    borderRadius: 4,
  },
  mfaCancelLabel: {
    color: Colors.cancelButtonText,
  },
  mfaConfirm: {
    width: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryButton,
    borderRadius: 4,
  },
  mfaConfirmLabel: {
    color: Colors.primaryButtonText,
  },
  mfaDisabled: {
    width: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.disabledButton,
    borderRadius: 4,
  },
  mfaDisabledLabel: {
    color: Colors.disabledButtonText,
  },
  mfaBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mfaContainer: {
    backgroundColor: Colors.modalBase,
    borderColor: Colors.modalBorder,
    borderWidth: 1,
    width: '80%',
    maxWidth: 400,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
  },
  mfaTitle: {
    fontSize: 20,
    color: Colors.descriptionText,
    paddingBottom: 8,
  },
  mfaDescription: {
    fontSize: 14,
    color: Colors.descriptionText,
  },
  mfaCode: {
    width: 400,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    opacity: 0,
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.modalBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tos: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeterms: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
  },
  agreetermstext: {
    color: Colors.primary,
    paddingLeft: 8,
    fontSize: 14,
  },
  viewterms: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  viewtermstext: {
    color: Colors.primary,
    fontSize: 14,
  },
  terms: {
    borderRadius: 4,
    maxHeight: '80%',
    padding: 8,
    margin: 16,
    backgroundColor: Colors.modalBase,
  },
  done: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 4,
    backgroundColor: Colors.closeButton,
    marginTop: 8,
  },
  donetext: {
    color: Colors.closeButtonText,
    fontSize: 16,
  },
  termsheader: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.text,
  },
  termstext: {
    color: Colors.text,
  },
  container: {
    flexDirection: 'column',
    backgroundColor: Colors.modalBase,
    borderRadius: 4,
    width: '100%',
    height: '100%',
    display: 'flex',
    paddingLeft: 16,
    paddingRight: 16,
    },
  control: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    color: Colors.grey,
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontSize: 24,
    color: Colors.descriptionText,
  },
  spacemid: {
    flexGrow: 1,
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  spacetop: {
    flexGrow: 1,
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  header: {
    fontSize: 32,
    color: Colors.text,
  },
  inputwrapper: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderRadius: 4,
    backgroundColor: Colors.inputBase,
    marginBottom: 16,
    alignItems: 'center',
  },
  inputfield: {
    flex: 1,
    textAlign: 'center',
    padding: 8,
    flexGrow: 1,
    color: Colors.inputText,
  },
  reset: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 28,
    backgroundColor: Colors.primaryButton,
    borderRadius: 4,
  },
  resettext: {
    color: Colors.primaryButtonText,
  },
  noreset: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 28,
    borderRadius: 4,
    backgroundColor: Colors.disabledButton,
  },
  noresettext: {
    color: Colors.disabledButtonText,
  },
  login: {
    marginTop: 16,
  },
  logintext: {
    color: Colors.primary,
  },
  nologintext: {
    color: Colors.disabled,
  },
  version: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  versiontext: {
    color: Colors.grey,
    fontSize: 14,
  },
})

