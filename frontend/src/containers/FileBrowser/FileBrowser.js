import React, {Component} from 'react';
import {connect} from 'react-redux';

import axios from '../../axios-fileBrowser';

import Dir from './Dir/Dir';
import File from './File/File';
import PathPart from './PathPart/PathPart';
import * as actions from '../../store/actions/index';
import Spinner from '../../components/Spinner/Spinner';
import InfoCard from './InfoCard/InfoCard';
import FileUploadInput from './FileUploadInput/FileUploadInput';
import Input from '../Input/Input';

import classes from './FileBrowser.css';

import {rootId} from '../../shared/constants';

class FileBrowser extends Component {
  state = {
    showFileUpload: false,
  }

  spaceOptions = [
    {"label": "add directory", "action":() => {this.addDirectoryClick()}, "holdBackdrop": true},
    {"label": "upload file", "action":() => {this.uploadFileClick()}, "holdBackdrop": false},
    {"label": "upload directory", "action":() => {this.uploadDirClick()}, "holdBackdrop": false},
    {"label": "properties", "action":() => {this.propertiesClick()}, "holdBackdrop": true},
  ]

  uploadDirFormRef = React.createRef()

  uploadDirInputRef = React.createRef()

  onMouseMove = (event) => {
    const x = event.pageX;
    const y = event.pageY;
    this.props.updatePosition(x, y);
  }

  showContextMenu = (event, options=this.spaceOptions) => {
    if (event) {
      event.preventDefault();
    }
    this.props.onSetContextMenu(options);
    this.props.onSetBackdrop();
  }

  propertiesClick = () => {
    const id = parseInt(this.props.hashPath[this.props.hashPath.length - 1]);
    const data = this.props.dirs.find(dir => dir.id === id);
    this.props.onSetInfoCard(data);
  }

  addDirectoryClick = () => {
    this.props.onSetNewDir();
  }

  addNewDir = (value) => {
    const dirId = parseInt(this.props.hashPath[this.props.hashPath.length - 1]);
    axios.post('/newdir/', {
      dirId: dirId,
      value: value,
    })
      .then(response => {
        //TODO: Show Message and save current opened path
        this.componentDidMount();
      })
      .catch(error => {
        console.log(error);
      });
    this.props.onHideBackdrop();
  }

  uploadFileClick = () => {
    this.setState({showFileUpload: true});
  }

  uploadDirClick = () => {
    this.uploadDirInputRef.current.click();
  }

  uploadDir = (event) => {
    event.preventDefault();

    const data = new FormData(this.uploadDirFormRef.current);
    if (data.getAll('file').length === 0) {
      //TODO: show Message that empty dirs will be skipped
      return
    } 
    const dirId = parseInt(this.props.hashPath[this.props.hashPath.length - 1]);
    const relPaths = data.getAll('file').map(f => f.webkitRelativePath);
    const json = JSON.stringify(relPaths);
    const blob = new Blob([json], {
      type: 'application/json',
    });
    data.append('relPaths', blob);

    axios({
      method: 'post',
      url: '/upload_dir/' + dirId + '/',
      data: data, 
      headers:{"content-type": 'application/form-data'},
    })
      .then(response => {
        this.uploadDirInputRef.current.value = null;
        this.componentDidMount();
      })
      .catch(error => {
        this.uploadDirInputRef.current.value = null;
        console.log('(((');
        console.log(error);
      });
  }

  componentDidMount() {
    this.props.prepareStructure(
      rootId, 
      this.props.match.params.dirHash, 
      this.props.match.params.fileHash
    );
  }

  render() {

    let fileBrowserContent = (
      <div className={classes.SpinnerContainer}>
        <Spinner />
      </div>
    );

    if(!this.props.loading && !this.props.loadingAsync) { 

      let items = null;
      let pathRow = null;

      if (this.props.items.length > 0) {

        const structure = Object.entries(this.props.items[this.props.items.length - 1]);
        items = structure.map((item) => {
          return item[1].type === "file" ?
            (<File
              key={item[0]}
              id={item[0]}
              name={item[1].name}
              ext={item[1].ext}
              showContextMenu={this.showContextMenu}
              info={item[1]} />
            ) : (
            <Dir
              key={item[0]}
              id={item[0]}
              name={item[1].name}
              open={() => this.props.addDirToPath(item[1].content, item[0], item[1].name)}
              showContextMenu={this.showContextMenu}
              info={item[1]} />
            );
        });

        pathRow = this.props.path.map((name, index) => {
          return (
            <PathPart
              key={name}
              pathPartName={name}
              goToPath={() => this.props.openFromPath(index)} />
          );
        });
      }

      fileBrowserContent = (
        <React.Fragment>
          <div className={classes.PathRow}>{pathRow}</div>
          <div 
            onContextMenu={(event) => this.showContextMenu(event)} 
            className={classes.Items}
            onMouseMove={(event) => this.onMouseMove(event)}
          >
            {items}
          </div>
        </React.Fragment>
      );
    }

    let infocard = null;
    if (this.props.showInfoCard) {
      infocard = <InfoCard/>;
    }

    let fileUploadInput = null;
    if (this.state.showFileUpload) {
      fileUploadInput = <FileUploadInput/>
    }

    let addNewDir = null;
    if (this.props.showNewDir) {
      addNewDir = (
        <Input
          label="New Directory"
          failLabel="cancel"
          successLabel="add"
          onFail={this.props.onHideBackdrop}
          onSuccess={(value) => this.addNewDir(value)}
          onContainerClick={this.props.onHideBackdrop}/>
      );
    }

    const dirUpload = (
      <form
        style={{display: 'none'}}
        ref={this.uploadDirFormRef}
        encType='multipart/form-data'
      >
        <input
          type='file'
          multiple={true}
          name='file'
          webkitdirectory='true'
          mozdirectory='true'
          onChange={this.uploadDir}
          ref={this.uploadDirInputRef}/>
      </form>
    );
    
    return (
      <React.Fragment>
        <div className={classes.FileBrowser}>
          {fileBrowserContent}
        </div>
        {infocard}
        {addNewDir}
        {fileUploadInput}
        {dirUpload}
      </React.Fragment>
      
    );
  }
}

const mapStateToProps = state => {
  return {
    showBackdrop: state.fileBrowser.showBackdrop,
    showInfoCard: state.fileBrowser.showInfoCard,
    showNewDir: state.fileBrowser.showNewDir,
    loading: state.fileBrowser.loading,
    loadingAsync: state.fileBrowser.loadingAsync,
    dirs: state.fileBrowser.dirs,
    files: state.fileBrowser.files,
    items: state.fileBrowser.items,
    path: state.fileBrowser.path,
    hashPath: state.fileBrowser.hashPath,
    newDirName: state.fileBrowser.newDirName,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onSetBackdrop: () => dispatch(actions.setBackdrop()),
    onHideBackdrop: () => dispatch(actions.hideBackdrop()),
    onSetContextMenu: (options) => dispatch(actions.setContextMenu(options)),
    onSetInfoCard: (data) => dispatch(actions.setInfoCard(data)),
    onSetNewDir: () => dispatch(actions.setNewDir()),
    updatePosition: (x, y) => dispatch(actions.getPostion(x, y)),
    fetchDirs: () => dispatch(actions.fetchDirs()),
    fetchFiles: () => dispatch(actions.fetchFiles()),
    prepareStructure: (rootId, dirHash, fileHash) => dispatch(actions.prepareStructure(rootId, dirHash, fileHash)),
    addDirToPath: (content, hash, name) => dispatch(actions.addDirToPath(content, hash, name)),
    openFromPath: (index) => dispatch(actions.openFromPath(index)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowser);