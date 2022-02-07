

// file-loader
declare module "*.css" {
    const url: string;
    export default url;
}

// raw-loader
/*declare module "*.css" {
    const content: string;
    export default content;
}*/


/*declare module "*.css" {
    var styles: { [key: string]: string };
    export default styles;
}*/