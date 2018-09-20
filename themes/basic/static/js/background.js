var Background = {};

Background.list = [
    '09.jpg', '10044311.jpg', '13594504.jpg', '13594529.jpg', '13706440.jpg', '14866588.png', '14866591.png', '14866598.png',
    '14866602.png', '15.jpg', '1783600.jpg', '1783938.jpg', '2127844.jpg', '2128665.jpg', '2515514.jpg', '2537371.jpg',
    '3685791.jpg', '4689060.jpg', '4689218.jpg', '4919196.jpg', '5176891.jpg', '5901477.jpg', '5901506.jpg', '5901587.jpg',
    '5901617.jpg', '8125220.jpg', '8150639.jpg', '8402375.jpg', '9919825.jpg', '9920004.jpg'
];

Background.prefix = '/theme/backgrounds/';

Background.change = function () {
    var index = parseInt(Math.random() * Background.list.length);

    document.body.style.background = 'url(' + Background.prefix + Background.list[index] + ') no-repeat fixed right bottom';
};

if (window.screen.width > 980) {
  Background.change();
}
