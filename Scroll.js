/**
 * Created by BG236557 on 2016/12/8.
 */
require('./style/scroll.less');

const React = require('react');
const Gesture = require('./Gesture');
const {assign} = require('./util.js');

class Scroll extends React.Component {
    constructor(props) {
        super(props);
        this.timer = null;
        this.locked = false;
        this.isTransition = false;
        this._scrollerHeight = 0;
        this._wrapperHeight = 0;
        this._innerHeight = 0;
        this._maxScrollY = 0;
        this._offsetY = 0;
        this.state = {
            _transform: 'transform',
            _transitionDuration: 'transitionDuration',
            _transitionTimingFunction: 'transitionTimingFunction',

            startY: 0,
            movedY: 0,
            pointY: 0,
            easeTime: 0,
            used: false,
            scrollEnd: false,
            loadOnTop: false,
            loadOnBottom: false,
            easeStyle: 'cubic-bezier(0.1, 0.57, 0.1, 1)',
        };
    }

    componentDidMount() {
        //hide body when overflow !important
        let body = document.body;
        body.style.overflow = 'hidden';
        // set css prefix
        let _prefix = (() => {
            var vendors = ['t', 'WebkitT'],
                transform,
                l = vendors.length;

            for (; l--;) {
                transform = vendors[l] + 'ransform';
                if (transform in body.style) {
                    return vendors[l].slice(0, -1);
                }
            }

            return '';
        })();

        this._prefix = _prefix;

        this.setState({
            _transform: this._prefixStyle('transform'),
            _transitionDuration: this._prefixStyle('transitionDuration'),
            _transitionTimingFunction: this._prefixStyle('transitionTimingFunction'),
        });

        this._getInitial();
        document.addEventListener('resize', this._getInitial.bind(this), false);
        document.addEventListener(`${_prefix.toLowerCase() + (_prefix ? "T" : "t")}ransitionEnd`, this._transitionEnd.bind(this), false);
    }

    componentWillReceiveProps(props) {
        if (!this.state.used && props.startY != this.props.startY) {
            this.setState({used: true, startY: parseFloat(props.startY)});
        }
        if (props.reset) {
            console.log('Customize Reset To Top');
            this._scrollTo(0, 0, 400);
        }
    }

    componentDidUpdate() {
        this._getInitial();
    }

    _getInitial() {
        let wrapper = this.refs.wrapper;
        let scroller = this.refs.scroller;
        let _wrapperHeight = wrapper.clientHeight;
        let _scrollerHeight = scroller.scrollHeight || scroller.clientHeight;
        // let _offsetY = this._getOffsetWrap(wrapper);
        let _maxScrollY = _wrapperHeight - _scrollerHeight;

        if (_maxScrollY > 0) {
            this.locked = true;
        } else {
            this.locked = false;
        }

        this._maxScrollY = _maxScrollY;
        this._wrapperHeight = _wrapperHeight;
        this._scrollerHeight = _scrollerHeight;
        this._innerHeight = window.innerHeight;
    }

    _getOffsetWrap(input) {
        let offsetTop = 0;
        while (input && input.nodeName.toLocaleLowerCase() !== 'body') {
            offsetTop += input.offsetTop;
            input = input.offsetParent;
        }
        return offsetTop;
    }

    _prefixStyle(style) {
        let _prefix = this._prefix;
        if (_prefix === '') return style;
        return _prefix + style.charAt(0).toUpperCase() + style.substr(1);
    }

    _getMomentum(current, start, time) {
        let distance = current - start,
            _wrapperHeight = this._wrapperHeight,
            _maxScrollY = this._maxScrollY,
            speed = Math.abs(distance) / time,
            deceleration = 0.0008,
            destination,
            duration;

        destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
        duration = speed / deceleration;

        if (destination < _maxScrollY) {
            destination = _wrapperHeight ? _maxScrollY - (_wrapperHeight / 2.5 * (speed / 8)) : _maxScrollY;
            distance = Math.abs(destination - current);
            duration = distance / speed;
        } else if (destination > 0) {
            destination = _wrapperHeight ? _wrapperHeight / 2.5 * (speed / 8) : 0;
            distance = Math.abs(current) + destination;
            duration = distance / speed;
        }

        return {
            destination: Math.round(destination),
            duration: duration
        };
    };

    _transitionEnd(e) {
        if (e.target != this.refs.scroller) return;
        let {start, length, init, onRefresh, onScrollEnd} = this.props;
        this.setState({easeTime: 0}, ()=> {
            if (!this._resetPosition()) {
                this.isTransition = false;
            }
            if (this.state.loadOnTop) {
                onRefresh(this.handleTopLoad.bind(this));
            }
            if (this.state.loadOnBottom) {
                init(start + length, length, this.handleBottomLoad.bind(this));
            }
            if (this.state.scrollEnd) {
                onScrollEnd(this.handleScrollEnd.bind(this));
                console.log('Scroll End');
            }
            console.log('Transition End')
        });
    }

    //reset position to top or bottom
    _resetPosition() {
        let {startY, movedY} = this.state;
        let _maxScrollY = this._maxScrollY;
        let distY = startY + movedY;
        if (distY > 0) {
            console.log(`Reset To Top: ${distY}, ${startY}, ${movedY}`);
            this._scrollTo(0, 0, 400);
            return true;
        }
        if (!this.locked && distY < _maxScrollY) {
            console.log('Reset To Bottom');
            this._scrollTo(0, _maxScrollY, 400);
            return true;
        }

        return false;
    }

    _scrollTo(startY, movedY, easeTime, easeStyle) {
        let {start, length, totalSize, pullDownRefresh, pullUpRefresh} = this.props;
        easeStyle = easeStyle || 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        this.isTransition = easeTime > 0;
        let scrollEnd = false;
        let loadOnTop = false;
        let loadOnBottom = false;
        if (pullDownRefresh && startY === movedY && !movedY && (this.state.startY + this.state.movedY) >= 45) {
            loadOnTop = true;
        } else if (pullUpRefresh && !this.locked && !startY && movedY === this._maxScrollY && easeTime == 400) {
            if ((start + 1) * length < totalSize) {
                loadOnBottom = true;
                movedY -= 65;
            } else {
                // scrollEnd = true;
            }
        }
        this.setState({startY, movedY, easeTime, easeStyle, scrollEnd, loadOnTop, loadOnBottom});
    }

    handleTopLoad() {
        this.timer = setTimeout(() => {
            this.setState({loadOnTop: false, easeTime: 400});
            clearTimeout(this.timer);
            this.timer = null;
        }, 600)
    }

    handleBottomLoad() {
        this.setState({loadOnBottom: false, easeTime: 400})
    }

    handleScrollEnd() {
        this.setState(prevState=> {
            if (this.isTransition) {
                prevState.easeTime = 0;
                this.isTransition = false;
                console.log('Stop Transition When Scroll End');
            }
            prevState.scrollEnd = false;
            return prevState;
        });
    }

    //stop easing && record start-y
    onSwipeStart(e) {
        if (this.locked && !this.props.pullDownRefresh) return;

        this.setState(prevState => {
            let distY = prevState.movedY + prevState.startY;

            prevState.movedY = 0;
            prevState.startY = distY;
            prevState.pointY = distY;
            if (this.isTransition) {
                prevState.easeTime = 0;
                this.isTransition = false;
                console.log('Stop Transition When Touch Start')
            }
            return prevState;
        }, () => {
            console.log(`!!!!START: startY ${this.state.startY}, movedY ${this.state.movedY}, pointY ${this.state.pointY}`)
        });
    }

    onSwipeMove(direction, e) {
        if (this.locked && (!this.props.pullDownRefresh || (this.props.pullDownRefresh && direction > 0))) return;

        // at less move 10 pixel
        if (e.duration > 300 && e.distance < 10) {
            return;
        }

        this.setState(prevState => {
            let movedY = e.offsetY,
                distY = prevState.startY + prevState.movedY;

            //reduce speed when boundaries
            if (distY > 0 || distY < this._maxScrollY) {
                //increment should tends to 0
                movedY = movedY / 3;
                if (direction > 0) {
                    movedY = movedY > prevState.movedY ? prevState.movedY : movedY;
                } else {
                    movedY = movedY < prevState.movedY ? prevState.movedY : movedY;
                }
                distY = prevState.startY + movedY;
            }
            if (e.duration > 300) {
                prevState.pointY = distY;
            }

            prevState.movedY = movedY;
            return prevState;
        }, () => {
            console.log(`MOVE: startY ${this.state.startY}, movedY ${this.state.movedY}, pointY ${this.state.pointY} `)
        });
        // this.setState(old=> {
        //     old.ease = false;
        //     old.animation = false;
        //     return old;
        // }, ()=> {
        //     this.setState(old => {
        //         let result = old.startY + offset;
        //         if (scrollToUpdate && (start + 1) * length < totalSize
        //             && old.startY + old.offsetY < bottomHeight) {
        //             old.loadOnBottom = true;
        //         }
        //         if (dragToUpdate && result >= topHeight) {
        //             old.loadOnTop = true;
        //             old.offsetY = topHeight;
        //         }
        //         if ((result > bottomHeight - topHeight) && ( result < topHeight )) {
        //             old.offsetY = offset;
        //         }
        //         return old;
        //     });
        // });
    }

    onSwipeEnd(e) {
        if (this.locked && (!this.props.pullDownRefresh || (this.props.pullDownRefresh && e.direction === 'Up'))) return;

        let duration = e.duration,
            distY = this.state.startY + this.state.movedY,
            distance, momentumY, easeStyle;

        //reset position if out of boundaries
        if (this._resetPosition(distY)) {
            return;
        }

        let {startY, movedY, pointY} = this.state;
        let _maxScrollY = this._maxScrollY;
        distY = startY + movedY;

        //when momentum at least move 10 pixel
        if (duration < 300 && e.distance > 10) {
            this.isTransition = true;
            momentumY = this._getMomentum(distY, pointY, duration);
            distance = momentumY.destination;
            duration = momentumY.duration;
            if (distance > 0 || distance < _maxScrollY) {
                easeStyle = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }
            this._scrollTo(startY, distance - distY, duration, easeStyle);
            console.log(`MOMENTUM: startY ${this.state.startY}, movedY ${this.state.movedY}, pointY ${this.state.pointY},  momentumY ${distance - distY}`)
        }
    }

    render() {
        let {id, style, className, totalSize, start, length, pullDownRefresh, pullUpRefresh, children} = this.props;
        let {
            _transform, _transitionDuration, _transitionTimingFunction,
            easeTime, easeStyle, startY, movedY, loadOnTop, loadOnBottom
        } = this.state;

        const scrollStyle = {};
        const wrapperStyle = assign({overflow: 'hidden'}, style);
        scrollStyle[_transform] = `translateY(${startY + movedY}px) translateZ(0px)`;
        scrollStyle[_transitionDuration] = `${easeTime}ms`;
        scrollStyle[_transitionTimingFunction] = easeStyle;
        // console.log(`Render: ${startY}, ${movedY}, ${startY + movedY}`);
        return (
            <Gesture
                onSwipeStart={this.onSwipeStart.bind(this)}
                onSwipeUp={this.onSwipeMove.bind(this, 1)}
                onSwipeDown={this.onSwipeMove.bind(this, -1)}
                onSwipeEnd={this.onSwipeEnd.bind(this)}
            >
                <div
                    id={id}
                    ref="wrapper"
                    className={className}
                    style={wrapperStyle}>
                    {pullDownRefresh &&
                    (
                        loadOnTop ?
                            <div className="refresh_pulldown">
                                <div className="icon-load"></div>
                                <div>加载中...</div>
                            </div> :
                            <div className="hint_pulldown">下拉刷新</div>
                    )
                    }
                    <div
                        ref="scroller"
                        style={scrollStyle}
                    >
                        {children}
                        {(pullUpRefresh && loadOnBottom) &&
                        <div className="refresh_pullup">
                            <div className="icon-load"></div>
                            <div>加载中...</div>
                        </div>
                        }
                    </div>
                    {(pullUpRefresh && !loadOnBottom && !this.locked && (start + 1) * length < totalSize) &&
                    <div className="hint_pullup">上拉刷新</div>}
                </div>
            </Gesture>
        )
    }
}

Scroll.defaultProps = {
    id: '',
    className: '',
    start: 0,
    length: 0,
    startY: 0,
    style: {},
    totalSize: 0,
    init: () => {
    },
    onRefresh: () => {
    },
    onScrollEnd: ()=> {
    },
    pullUpRefresh: false, //上拉刷新
    pullDownRefresh: false //下拉刷新
};

module.exports = Scroll;
