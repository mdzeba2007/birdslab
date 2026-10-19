particlesJS("particles-js", {
    particles: {
        number: {
            value: 70
        },

        color: {
            value: "#00bfff"
        },

        size: {
            value: 3
        },

        opacity: {
            value: 0.9
        },

        line_linked: {
            enable: true,
            distance: 160,
            color: "#ffffff",
            opacity: 0.7,
            width: 1
        },

        move: {
            enable: true,
            speed: 1.5
        }
    },

    interactivity: {
        events: {
            onhover: {
                enable: true,
                mode: "grab"
            }
        },

        modes: {
            grab: {
                distance: 200,
                line_linked: {
                    opacity: 1
                }
            }
        }
    },

    retina_detect: true
});