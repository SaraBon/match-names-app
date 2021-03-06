import React, { Component } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Swipeable } from "react-swipeable";
import Error from "./ErrorComp";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  addName,
  getFriendsNames,
  calcUnseenNames,
  addSeenName,
  updateUnseenNames
} from "./actions/userActions";

import Loader from "react-loader-spinner";

let selectedStyle = {
  backgroundColor: "#798199"
};

class Board extends Component {
  state = {
    namesStack: [],
    unseenFriendsNames: [],
    nameCount: 0,
    error: false,
    loading: true,
    // for swipe animation & toggle buttons
    x: 0,
    rotation: 0,
    opacity: 1,
    direction: "",
    showYesIcon: false,
    showYesIcon: false,
    gender: "all"
  };

  componentDidMount() {
    this.getNames();
    // if a user is logged in and has a linked friend who has names
    // calculate the friend's names which the current user hasn't seen yet
    if (this.props.state.friendsNames.length > 0) {
      this.props.calcUnseenNames();
    }
  }

  //get new random names and push them to the name stack
  getNames = async gender => {
    this.setState({ loading: true });
    let namesStackTemp = [];
    //get more names from the database
    axios
      .get(`/names/get/${gender || this.state.gender}`)
      .then(res => {
        let names = res.data;
        names.forEach(name => {
          namesStackTemp.unshift(name.name);

          return namesStackTemp;
        });
      })
      .then(res => {
        this.setState({
          namesStack: [...this.state.namesStack, ...namesStackTemp]
        });
      })
      .then(res => {
        this.setState({ loading: false });
      })
      .catch(err => {
        this.setState({
          error: "Error loading names, please check your internet connection."
        });
      });
  };

  injectFriendsName = () => {
    //get the fist name of the array of unseen friends names
    const unseenName = this.props.state.unseenNames[0];
    //push it to the end of the name stack to be shown to the current user
    this.setState({
      namesStack: [...this.state.namesStack, unseenName]
    });
    //add that name to the database of seen names of the current user
    this.props.addSeenName(this.props.state.user._id, unseenName);
    //remove that name from the store of unseen names
    this.props.updateUnseenNames();
  };

  // remove the currently displayed name from the stack
  removeName = () => {
    let namesStackTemp = [...this.state.namesStack];
    namesStackTemp.splice(-1, 1);
    this.setState(
      {
        namesStack: namesStackTemp,
        nameCount: (this.state.nameCount += 1)
      },
      () => {
        // every 10th swipe, inject a friend's name and set back the count
        if (
          this.state.nameCount === 10 &&
          this.props.state.unseenNames &&
          this.props.state.unseenNames.length > 0
        ) {
          this.injectFriendsName();
          this.setState({ nameCount: 0 });
        }

        //check if the namesStack has less then 2 entries and if so, add new names to it
        this.state.namesStack.length === 0 && this.getNames();
      }
    );
  };

  // when user "likes" the name
  swipedYes = () => {
    //check if the liked name is a match
    this.checkForMatch();

    //if the user is logged in, add the name to the user's list
    if (this.props.state.isAuthenticated) {
      this.props.addName(
        this.props.state.user._id,
        this.state.namesStack[this.state.namesStack.length - 1]
      );
    }

    this.removeName();
  };

  // when user "dislikes" the name
  swipedNo = () => {
    this.removeName();
  };

  // check if a like is a match
  checkForMatch = () => {
    if (
      this.props.state.friendsNames.indexOf(
        this.state.namesStack[this.state.namesStack.length - 1]
      ) !== -1
    ) {
      toast.success("It's a match!");
    }
  };

  // function to handle the user's swipe of a name
  animateSwipe = (e, x, y) => {
    this.setState({
      x: -e.deltaX,
      direction: e.dir,
      rotation: -e.deltaX / 10,
      opacity: 1 - Math.abs(this.state.x) / 520
    });

    if (e.deltaX >= 90) {
      this.setState({ showNoIcon: true });
    } else if (e.deltaX <= -90) {
      this.setState({ showYesIcon: true });
    } else {
      this.setState({ showNoIcon: false, showYesIcon: false });
    }
  };

  handleSwipe = e => {
    const topCard = document.getElementById("card-top");
    if (e.deltaX >= 90 || e.deltaX <= -90) {
      e.dir === "Right" ? this.swipedYes() : this.swipedNo();
    }

    // when a swipe ends, reset all css animation & style
    this.setState({
      x: 0,
      rotation: 0,
      opacity: 1,
      showYesIcon: false,
      showNoIcon: false
    });
    topCard.style.background = "";
  };

  selectGender = e => {
    e.persist();
    this.setState({ gender: e.target.value });
    this.setState({ namesStack: [] }, () => this.getNames(e.target.value));
  };

  renderCards = () => {
    const { namesStack } = this.state;
    return namesStack.map((item, i) => {
      return (
        <div key={i} className="name-card">
          {item}
        </div>
      );
    });
  };

  render() {
    return this.state.error ? (
      <div className="content">
        <Error errorMessage={this.state.error} />
      </div>
    ) : this.state.loading ? (
      <div className="content">
        <div className="card-container">
          <Loader type="Hearts" color="#BFE2E2" height="100" width="100" />
        </div>
      </div>
    ) : (
      <div className="content">
        <div className="card-container">
          <div className="name-card">
            {this.state.namesStack[this.state.namesStack.length - 2]}
          </div>
          <Swipeable
            preventDefaultTouchmoveEvent={true}
            trackMouse={true}
            style={{ width: "320px" }}
            onSwiping={(e, x, y) => this.animateSwipe(e, x, y)}
            onSwiped={data => this.handleSwipe(data)}
          >
            <div
              className="name-card"
              id="card-top"
              style={{
                transform:
                  "translateX(" +
                  this.state.x +
                  "px) rotate(" +
                  this.state.rotation +
                  "deg)",
                opacity: this.state.opacity
              }}
            >
              <div
                style={{
                  opacity: this.state.showYesIcon ? "1" : "0",
                  position: "absolute",
                  left: "50%",
                  top: "50px"
                }}
              >
                <FontAwesomeIcon icon="laugh-beam" />
              </div>
              <div
                style={{
                  opacity: this.state.showNoIcon ? "1" : "0",
                  position: "absolute",
                  left: "50%",
                  top: "50px"
                }}
              >
                <FontAwesomeIcon icon="meh" />
              </div>
              {this.state.namesStack[this.state.namesStack.length - 1]}
            </div>
          </Swipeable>
          <div className="toggle-container">
            <button
              className="toggle-button"
              value="girl"
              style={this.state.gender === "girl" ? selectedStyle : {}}
              onClick={e => this.selectGender(e)}
            >
              girl
            </button>
            <button
              className="toggle-button"
              value="all"
              style={this.state.gender === "all" ? selectedStyle : {}}
              onClick={e => this.selectGender(e)}
            >
              all
            </button>
            <button
              className="toggle-button"
              value="boy"
              style={this.state.gender === "boy" ? selectedStyle : {}}
              onClick={e => this.selectGender(e)}
            >
              boy
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.auth
  };
};

export default connect(
  mapStateToProps,
  { addName, getFriendsNames, calcUnseenNames, addSeenName, updateUnseenNames }
)(Board);
