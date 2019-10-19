import React from 'react';
import { withRouter } from 'react-router-dom';
import Footer from '../footer/footer'; 
import UsersIndexItem from './users_index_item';
import languages from '../languages/languages'
import io from "socket.io-client";


class UsersIndex extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [], 
      showAdvanced: false, 
      filteredUsers: [],   
      learnLanguage: '', 
      speakLanguage: ''
    }

    
    this.possibleRooms = new Set();
    this.requestRoom = this.requestRoom.bind(this);
    this.socket = io();

    this.handleChange = this.handleChange.bind(this); 
    this.handleLearningLanguage = this.handleLearningLanguage.bind(this); 
    this.handleSpeakingLanguage = this.handleSpeakingLanguage.bind(this); 
  }

  handleChange(e) {
    this.setState({
      users: this.props.users.filter(x => x.handle.toLowerCase().includes(e.target.value.toLowerCase()))
    })
  }

  handleLearningLanguage(e) {
    if (e.target.value === 'none') {
      this.setState({
        users: this.props.users 
      })
    } else {
      this.setState({
        users: this.props.users.filter(x => x.to_learn === e.target.value)
      })
    }
  }

  handleSpeakingLanguage(e) {
    if (e.target.value === 'none') {
      this.setState({
        users: this.props.users
      })
    } else {
      this.setState({
        users: this.props.users.filter(x => x.to_share === e.target.value)
      })
    }
  }


  requestRoom(other_user_id) {
    const room_ids = [];
    console.log(`This user's id is ${this.props.currentUserId} and they are requesting this user id: ${other_user_id}`);
    room_ids.push(this.props.currentUserId + other_user_id);
    room_ids.push(other_user_id + this.props.currentUserId);
    this.socket.emit('request_room', room_ids); 
  }

  componentWillMount() {
    this.props.fetchUsers();
    sessionStorage.removeItem('storedRoomId');
  }

  componentDidMount() {

    this.socket.on('connect', () => {
      console.log('User index component is connected');
    }); 

    this.socket.on('possible_room', (room_id) => {
      this.possibleRooms.add(room_id);
      console.log('possibleRoom set');
    });

    this.socket.on('verified_room', (room_id) => {
      if (this.possibleRooms.has(room_id)) {
        console.log('successfully matched to right room');
        this.props.saveRoomId(room_id);
        this.props.history.push('/chat')
      }
    });

    this.socket.on('disconnect', () => {
      console.log('user index socket has disconnected')
    });

  }

  componentWillUnmount() {
    this.socket.emit('off-users-index');

  }

  componentWillReceiveProps(newState) {
    this.setState({ users: newState.users });
  }

  render() {
    if (this.state.users.length === 0) {
      return (
        <>
          <div className="chat-users-page">

            <input className="chat-users-searchbar"
            onChange={(e) => this.handleChange(e)} 
            type="text"
            placeholder="Search for a user" />

              <div className="chat-users-advanced">
                <select name="learning-language"
                  onChange={this.handleLearningLanguage}
                  className="chat-users-selector-language">
                  <option value="none">None</option>
                  {Object.keys(languages).map(x =>
                    <option key={x} value={x}>{languages[x]}</option>)}
                </select>

                <select name="speaking-language"
                  onChange={this.handleSpeakingLanguage}
                  className="chat-users-selector-language">
                  <option value="none">None</option>
                  {Object.keys(languages).map(x =>
                    <option key={x} value={x}>{languages[x]}</option>)}
                </select>
              </div>


            <div className="chat-users-nousers">No users match your criteria.</div>
          </div>
        </>)
    } else {
        // const users = this.state.users.map(user => (
        //     <UsersIndexItem key={user._id} user={user} />
        // ))
        const same_lang_users = []
        const users = []
        this.state.users.forEach(user => {
          if (user.to_share === this.props.currentUser.to_learn) {
            same_lang_users.push(<UsersIndexItem key={user._id} user={user} sameLang={true} requestRoom={this.requestRoom}/>)
          } else {
            if (user.email !== this.props.currentUser.email) users.push(<UsersIndexItem key={user._id} user={user} sameLang={false} requestRoom={this.requestRoom} />)
          }
        })

        // Want to create search function 
        const all_users = users.concat(same_lang_users); 
        console.log(all_users.map(x => x.props.user))
        console.log(Object.keys(languages).length); 
        // console.log(all_users.map(x => x.props.user.date).sort())
      return (
        <>

        <div className="chat-users-page">
            <span className="chat-users-search-icon"><i className="fas fa-search"></i></span>
            <input className="chat-users-searchbar"
              onChange={(e) => this.handleChange(e)}
              type="text"
              placeholder="Search for a user"  />

            <div className="chat-users-advanced">
              <div className="chat-users-filters">Find other Babblers based on criteria</div>
              <div style={{textAlign: 'left'}}>
              Learning: <select name="learning-language"
                onChange={this.handleLearningLanguage}
                className="chat-users-selector-language">
                  <option value="none">None</option>
                  {Object.keys(languages).map(x => 
                    <option key={x} value={x}>{languages[x]}</option>)}
              </select>
              </div>

              <div style={{ textAlign: 'left' }}>
              Speaking: <select name="speaking-language"
                onChange={this.handleSpeakingLanguage}
                className="chat-users-selector-language">
                  <option value="none">None</option>
                {Object.keys(languages).map(x =>
                  <option key={x} value={x}>{languages[x]}</option>)}
              </select>
              </div>
            </div>

            <h2 className="chat-users-number"><span className="chat-users-digit-default">{same_lang_users.length + users.length}</span> <span style={{ fontWeight: 'bold' }}>{same_lang_users.length + users.length === 1 ? "Babbler" : "Babblers"}</span>, <span className="chat-users-digit">{same_lang_users.length} </span> of which speak <span className="chat-users-active-language">{languages[this.props.currentUser.to_learn]}</span> </h2>
          <div className="users-grid">
              {same_lang_users}
              {users}
          </div>
        </div>
        <Footer />
        </>
      );
    }
  }
}

export default withRouter(UsersIndex);