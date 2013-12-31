module.exports = function(grunt) {
    grunt.initConfig({
        less: {
            src: {
                options: {
                    paths: ['vendor/bower/bootstrap/less'],
                    cleancss: true,
                    report: 'gzip'
                },
                files: {
                    'css/style.css': 'less/style.less'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
};
