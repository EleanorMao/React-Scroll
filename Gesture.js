/**
 * Created by elly on 2016/12/8.
 */
const React = require('react');

class Gesture extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            startX: null,
            startY: null,
            startTime: null
        }
    }

    getGestureEvent(e) {
        let Map = this.props.Map;
        let {clientX, clientY} = e.changedTouches[0];
        let {startX, startY, startTime} = this.state;
        let offsetX = clientX - startX;
        let offsetY = clientY - startY;
        let absX = Math.abs(offsetX);
        let absY = Math.abs(offsetY);
        let distance = Math.sqrt(absX * absX + absY * absY);
        let radius = Math.atan2(offsetY, offsetX);
        let angle = radius * (180 / Math.PI);
        let timestamp = new Date().getTime();
        let duration = timestamp - startTime;
        let direction = 'Left';
        Object.keys(Map).map(item => {
            if (angle <= Map[item].max && angle >= Map[item].min) {
                direction = item;
            }
        });

        return {
            startX,
            startY,
            clientX,
            clientY,
            offsetX,
            offsetY,
            absX,
            absY,
            radius,
            angle,
            distance,
            duration,
            timestamp,
            direction
        };
    }

    handleReset() {
        this.setState({startX: null, startY: null, startTime: null});
    }

    handleEmit(name, e) {
        if (name) {
            this.props[name](e);
        }
    }

    handleTouchStart(e) {
        let {clientX, clientY} = e.changedTouches[0];
        this.setState(old => {
            old.startX = clientX;
            old.startY = clientY;
            old.startTime = new Date().getTime();
            return old;
        });
        let gesture = e.changedTouches[0];
        gesture.timestamp = new Date().getTime();
        this.handleEmit('onSwipeStart', gesture);
    }

    handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        let input = document.querySelector('input');
        if (input) {
            input.blur();
        }
        let gesture = this.getGestureEvent(e);
        if (Math.abs(gesture.distance) < 1) return;
        this.handleEmit(`onSwipe${gesture.direction}`, gesture);
    }

    handleTouchEnd(e) {
        let gesture = this.getGestureEvent(e);
        this.handleReset();
        this.handleEmit('onSwipeEnd', gesture);
        if ((gesture.distance < 0.99 && gesture.duration < 300) || (gesture.distance < 2.5 && gesture.duration < 75)) {
            this.handleEmit('onTap', gesture);
        }
    }

    handleTouchCancel(e) {
        e.preventDefault();
        e.stopPropagation();

        let gesture = this.getGestureEvent(e);
        gesture.cancel = true;
        this.handleEmit('onSwipeEnd', gesture);
        this.handleReset();
    }

    render() {
        return (
            React.cloneElement(React.Children.only(this.props.children), {
                onTouchCancel: this.handleTouchCancel.bind(this),
                onTouchStart: this.handleTouchStart.bind(this),
                onTouchMove: this.handleTouchMove.bind(this),
                onTouchEnd: this.handleTouchEnd.bind(this)
            })
        )
    }
}

Gesture.defaultProps = {
    onSwipeUp: () => {
    },
    onSwipeDown: () => {
    },
    onSwipeLeft: () => {
    },
    onSwipeRight: () => {
    },
    onSwipeStart: () => {
    },
    onSwipeEnd: () => {
    },
    onTap: () => {
    },
    Map: {
        Up: {
            max: -60,
            min: -120
        },
        Down: {
            max: 120,
            min: 60,
        },
        Right: {
            max: 59,
            min: -59
        }
    }
};

Gesture.propTypes = {
    onSwipeUp: React.PropTypes.func,
    onSwipeDown: React.PropTypes.func,
    onSwipeLeft: React.PropTypes.func,
    onSwipeRight: React.PropTypes.func,
    onSwipeStart: React.PropTypes.func,
    onSwipeEnd: React.PropTypes.func
};
module.exports = Gesture;
