;
(() => {
    var carousel = function() {};
    carousel.prototype = {
        constructor: carousel,
        foreTranslate() {
            return `<div class="el-carousel">
               <div class="wrap" style="left:{{d}}px">
                    <img src="{{src1}}" class="myCarousel">
                </div>
                <div class="spanWrap" ref="span" >
                    <span x-repeat="imgs" class="span" index="{{$index}}"></span>
                </div>
            </div>`
        },
        init(view) {
            var template = `  <div class="el-carousel">
               <div class="wrap" style="transform:translateX({{d}}px)">
                    <img src="{{src1}}" class="myCarousel">
                </div>
                <div class="spanWrap" ref="span" >
                    <span x-repeat="imgs" class="span" index="{{$index}}"></span>
                </div>
            </div>`;
            view.innerHTML = template;
            view.$dataName = view.getAttribute("dataName");
            view.$forceRender = false;
        },
        getImage(index) {
            var me = this;
            return new Promise((r1, r2) => {
                var imgs = new Image();
                imgs.onload = () => {
                    me.imgs[index] = imgs;
                    r1();
                }
                imgs.src = me.data.imgs[index].url
            });
        },
        doRender(view) {
            var me=this;
            me.data.init = false;
            me.imgs = [];
            setTimeout(() => {
                me.dom = view.querySelector(".wrap");
                me.img = me.dom.querySelector("img");
                me.index = me.data.index;
                me.span = [...view.querySelectorAll("span")];
                me.span[me.index].classList.add("check");
                me.event = me.data.event;
                me.width = parseInt(DD.css(me.dom, "width")) / 2;
                me.$module = view.$module;
                var spanWrap = view.querySelector(".spanWrap");
                spanWrap.addEventListener("click", (e) => {
                    me.turn(e);
                }, false);
                window.addEventListener("transitionend", me.transitionEnd.bind(me), false);
                new DD.Event({
                    view: me.dom,
                    eventName: "swipeleft",
                    handler: me.goRight.bind(me)
                });
                new DD.Event({
                    view: me.dom,
                    eventName: "swiperight",
                    handler: me.goLeft.bind(me)
                });
                Promise.all(me.data.imgs.map((i, index) => {
                    return me.getImage(index);
                })).then(() => {
                    me.create();
                })
            }, 10);
        },
        //每次加了触发器的数据的改变化调用renden函数
        //可以在此函数里面改变没有触发器的函数或者再设置一个标准物
        //这里采用采用的是init字段
        render(view) {
            var me = this;
            me.data = view.$getData().data;
            me.strName =me.data.GPU?'transition':'position';
            if (!me.data.init)
                return;
            if (!me.data.GPU) {
                view.innerHTML = me.foreTranslate();
                DD.Compiler.compile(view, view.$module);
                me.doRender(view);
                return ;
            }
            me.doRender(view);
            //标志物字段
        },
        setTime() {
            var me = this;
            me.data.flag = false;
            me.timer = setInterval(me.move.bind(me, me.data.left), 3000);
        },
        create() {
            var me = this;
            if (me.data.left) {
                me.tem = me.imgs[(me.index + 1) % me.imgs.length];
                me.leaveLeft = false;
            } else {
                me.leaveLeft = true;
                me.tem = me.imgs[(me.index - 1 + me.imgs.length) % me.imgs.length]
            }
            me.setTime();
            window.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    clearInterval(me.timer);
                } else {
                    me.setTime();
                }
            }, false);
        },
        move(flag = false, index) {
            var me = this;
            if (index || index === 0) {
                me.index = index;
            }
            // console.log(me.index);
            if (flag) {
                me.data.d = 0;
                me.tem = me.imgs[(me.index + 1) % me.imgs.length];
                setTimeout(() => {
                    me.dom.appendChild(me.tem);
                    me.moveLeft(0);
                }, 40);
                return;
            } else {
                me.tem = me.imgs[(me.index - 1 + me.imgs.length) % me.imgs.length];
                me.data.d = -1 * me.width;
                me.dom.insertBefore(me.tem, me.img);
                setTimeout(() => {
                    me.moveRight(-1 * me.width);
                }, 40);
                return;
            }
        },
        transitionEnd() {
            var me = this;
            me.dom.classList.remove(me.strName);
            if (me.leaveLeft) {
                me.index = (me.index + 1) % me.imgs.length;
                me.updateSpan();
            } else {
                me.index = (me.index - 1 + me.imgs.length) % me.imgs.length;
                me.updateSpan();
            }
            me.data.flag = true;
        },
        turn(e) {
            var me = this;
            var key = parseInt(e.target.getAttribute("index"));
            if (key === undefined || key === me.index || isNaN(key)) {
                return;
            }
            if (!me.data.flag)
                return;
            me.data.flag = false;
            clearInterval(me.timer);
            if (key > me.index) {
                me.move(true, key - 1);
            } else {
                me.move(false, key + 1);
            }
            me.setTime();
        },
        moveLeft(d) {
            var me = this;
            me.dom.classList.add(me.strName);
            me.data.flag = false;
            me.data.d = -me.width;
            me.leaveLeft = true;
        },
        moveRight(d) {
            var me = this;
            me.dom.classList.add(me.strName);
            me.data.flag = false;
            me.data.d = 0;
            me.leaveLeft = false;
        },
        updateSpan() {
            var me = this;
            me.span.forEach(i => {
                i.classList.remove("check");
            });
            me.span[me.index].classList.add("check");
            me.dom.removeChild(me.img);
            me.img = me.tem;
            me.data.d = 0;
            me.data.flag = true;
        },
        goLeft() {
            var me = this;
            if (!me.data.flag)
                return;
            clearInterval(me.timer);
            me.data.flag = false;
            me.leaveLeft = false;
            me.move(false);
            me.setTime();
            me.event["left"] && me.$module.methodFactory.methods[me.event["left"]].call(me.$module);
        },
        goRight() {
            var me = this;
            if (!me.data.flag)
                return;
            clearInterval(me.timer);
            me.data.flag = false;
            me.leaveLeft = true;
            me.move(true);
            me.setTime();
            me.event["right"] && me.$module.methodFactory.methods[me.event["right"]].call(me.$module);
        }
    }
    DD.Plugin.create("carousel", carousel);
    DD.createModule({
        el: ".test",
        require: [{ type: 'css', url: "carousel.css" }],
        data: {
            carousel: {
                src1: "imgs/banner001.jpg",
                //默认采用GPU加速
                GPU: true,
                imgs: [
                    { url: "imgs/banner001.jpg" },
                    { url: "imgs/banner002.jpg" },
                    { url: "imgs/banner003.jpg" },
                    { url: "imgs/banner004.jpg" },
                    { url: "imgs/banner005.jpg" },
                ],
                //开始的index src1要对应imgs修改 
                index: 2,
                //滑动完成之后的标志物
                flag: false,
                //每次移动的距离一般不改变
                d: 0,
                //轮播方向
                left: true,
                //轮播速度不能太慢
                speed: 10,
                //初始化标志物
                init: true,
                //滑动手势之后的function name
                event: {
                    right: "right",
                    left: "left"
                }
            },
            dddd: 1111,
        },
        methods: {
            right() {
                // console.log(1111);
            },
            left() {
                // console.log(22222);
            }
        },
        onBeforeFirstRender() {
            var me = this.data.carousel;
            me.index = (me.index % me.imgs.length + me.imgs.length) % me.imgs.length;
            me.src1 = me.imgs[me.index].url;
        },
        onFirstRender() {},
    });
})()